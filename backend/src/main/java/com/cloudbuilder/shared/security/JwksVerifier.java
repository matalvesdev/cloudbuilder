package com.cloudbuilder.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAPublicKeySpec;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Verifies JWT ID token signatures using JWKS (JSON Web Key Sets).
 *
 * Supports RS256/RS384/RS512 for providers like Google, Azure AD, Okta.
 * Keys are fetched from the provider's JWKS endpoint and cached for 1 hour.
 * This closes the signature verification gap identified in ADR-025 audit (H1).
 */
@Component
public class JwksVerifier {

    private static final Logger log = LoggerFactory.getLogger(JwksVerifier.class);
    private static final long CACHE_TTL_MS = 3600_000; // 1 hour

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedJwks> cache = new ConcurrentHashMap<>();

    public JwksVerifier(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Verify the signature of an ID token using the provider's JWKS endpoint.
     *
     * @param idToken the raw JWT ID token
     * @param jwksUrl the JWKS endpoint URL for the provider
     * @return true if the signature is valid
     */
    public boolean verify(String idToken, String jwksUrl) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length != 3) {
                log.warn("Invalid JWT format: expected 3 parts, got {}", parts.length);
                return false;
            }

            // Decode JWT header to extract kid and algorithm
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            @SuppressWarnings("unchecked")
            Map<String, Object> header = objectMapper.readValue(headerJson, LinkedHashMap.class);

            String kid = (String) header.get("kid");
            String alg = (String) header.get("alg");

            if (kid == null) {
                log.warn("JWT header missing 'kid' — cannot verify with JWKS");
                return false;
            }
            if (alg == null) {
                log.warn("JWT header missing 'alg' — cannot verify signature");
                return false;
            }

            // Get the public key for this kid from JWKS
            PublicKey publicKey = resolvePublicKey(jwksUrl, kid);
            if (publicKey == null) {
                log.warn("No JWK found for kid={} at {}", kid, jwksUrl);
                return false;
            }

            // Verify signature
            String signedContent = parts[0] + "." + parts[1];
            byte[] signature = Base64.getUrlDecoder().decode(parts[2]);

            String javaAlgorithm = switch (alg) {
                case "RS256" -> "SHA256withRSA";
                case "RS384" -> "SHA384withRSA";
                case "RS512" -> "SHA512withRSA";
                case "ES256" -> "SHA256withECDSA";
                case "ES384" -> "SHA384withECDSA";
                case "ES512" -> "SHA512withECDSA";
                default -> {
                    log.warn("Unsupported JWT algorithm: {}", alg);
                    yield null;
                }
            };

            if (javaAlgorithm == null) return false;

            Signature sig = Signature.getInstance(javaAlgorithm);
            sig.initVerify(publicKey);
            sig.update(signedContent.getBytes());
            boolean valid = sig.verify(signature);

            log.debug("JWKS verification for kid={}: {}", kid, valid ? "valid" : "INVALID");
            return valid;

        } catch (Exception e) {
            log.warn("JWKS verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Resolve the public key for a given kid from the JWKS endpoint.
     * Results are cached for CACHE_TTL_MS.
     */
    private PublicKey resolvePublicKey(String jwksUrl, String kid) {
        CachedJwks cached = cache.get(jwksUrl);
        if (cached == null || System.currentTimeMillis() - cached.timestamp() > CACHE_TTL_MS) {
            try {
                String jwksJson = restTemplate.getForObject(jwksUrl, String.class);
                if (jwksJson == null) {
                    log.warn("Empty response from JWKS endpoint: {}", jwksUrl);
                    return null;
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> jwks = objectMapper.readValue(jwksJson, LinkedHashMap.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> keys = (List<Map<String, Object>>) jwks.get("keys");

                if (keys == null || keys.isEmpty()) {
                    log.warn("JWKS endpoint returned no keys: {}", jwksUrl);
                    return null;
                }

                Map<String, PublicKey> parsed = new HashMap<>();
                for (Map<String, Object> key : keys) {
                    String keyKid = (String) key.get("kid");
                    if (keyKid != null) {
                        try {
                            parsed.put(keyKid, parseJwk(key));
                        } catch (Exception e) {
                            log.debug("Skipping JWK kid={}: {}", keyKid, e.getMessage());
                        }
                    }
                }

                cached = new CachedJwks(parsed, System.currentTimeMillis());
                cache.put(jwksUrl, cached);
                log.info("Fetched and cached {} keys from JWKS endpoint: {}", parsed.size(), jwksUrl);

            } catch (Exception e) {
                log.warn("Failed to fetch JWKS from {}: {}", jwksUrl, e.getMessage());
                // Return stale cache if available, otherwise null
                if (cached != null) return cached.keys().get(kid);
                return null;
            }
        }
        return cached.keys().get(kid);
    }

    /**
     * Parse a JWK JSON object into a java.security.PublicKey.
     * Currently supports RSA keys (RS256/RS384/RS512).
     */
    private PublicKey parseJwk(Map<String, Object> jwk) throws Exception {
        String kty = (String) jwk.get("kty");
        if ("RSA".equals(kty)) {
            String nBase64 = (String) jwk.get("n");
            String eBase64 = (String) jwk.get("e");
            if (nBase64 == null || eBase64 == null) {
                throw new IllegalArgumentException("RSA JWK missing n or e");
            }
            BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(nBase64));
            BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(eBase64));
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return factory.generatePublic(new RSAPublicKeySpec(modulus, exponent));
        }
        throw new IllegalArgumentException("Unsupported key type: " + kty
            + " (only RSA is supported)");
    }

    private record CachedJwks(Map<String, PublicKey> keys, long timestamp) {}
}
