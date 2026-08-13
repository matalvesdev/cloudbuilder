package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.SsoProviderConfig;
import com.cloudbuilder.iam.domain.model.TenantUser;
import com.cloudbuilder.iam.domain.model.User;
import com.cloudbuilder.iam.domain.port.*;
import com.cloudbuilder.iam.infrastructure.config.SsoAuthConfiguration.SsoStateData;
import com.cloudbuilder.shared.security.JwtTokenProvider;
import com.cloudbuilder.shared.security.JwksVerifier;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

/**
 * SSO Authentication Service.
 *
 * Implements OAuth2 Authorization Code Flow with PKCE per ADR-025.
 * Provides state generation, authorization URL building, token exchange,
 * and user provisioning for SSO logins.
 */
@Service
@ConditionalOnBean(name = "oauthStateCache")
public class SsoAuthService {

    private static final Logger log = LoggerFactory.getLogger(SsoAuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SsoProviderConfigRepository providerConfigRepository;
    private final SsoProviderService ssoProviderService;
    private final UserRepository userRepository;
    private final TenantUserRepository tenantUserRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwksVerifier jwksVerifier;
    private final RestTemplate restTemplate;
    private final Cache<String, SsoStateData> oauthStateCache;
    private final ObjectMapper objectMapper;

    @Value("${cloudbuilder.sso.redirect-uris:http://localhost:3000/auth/callback,http://localhost:5173/auth/callback}")
    private String allowedRedirectUris;

    public SsoAuthService(SsoProviderConfigRepository providerConfigRepository,
                          SsoProviderService ssoProviderService,
                          UserRepository userRepository,
                          TenantUserRepository tenantUserRepository,
                          RoleRepository roleRepository,
                          JwtTokenProvider jwtTokenProvider,
                          JwksVerifier jwksVerifier,
                          RestTemplate restTemplate,
                          Cache<String, SsoStateData> oauthStateCache,
                          ObjectMapper objectMapper) {
        this.providerConfigRepository = providerConfigRepository;
        this.ssoProviderService = ssoProviderService;
        this.userRepository = userRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.roleRepository = roleRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwksVerifier = jwksVerifier;
        this.restTemplate = restTemplate;
        this.oauthStateCache = oauthStateCache;
        this.objectMapper = objectMapper;
    }

    /**
     * Build the OAuth2 authorization URL for a given tenant and provider.
     *
     * @param tenantId     the tenant requesting SSO
     * @param providerType the SSO provider type (google, azure, okta)
     * @param redirectUri  the callback URL to redirect after auth
     * @return the authorization URL to redirect the user's browser to
     */
    public String buildAuthorizationUrl(String tenantId, String providerType, String redirectUri) {
        String validatedRedirectUri = validateRedirectUri(redirectUri);
        SsoProviderConfig config = ssoProviderService.getConfigByTenantAndType(tenantId, providerType)
            .orElseThrow(() -> new IllegalArgumentException(
                "SSO provider não configurado para este tenant: " + providerType));

        if (!config.isEnabled()) {
            throw new IllegalArgumentException("Provedor SSO desabilitado: " + providerType);
        }

        // Generate PKCE code verifier + challenge
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);

        // Generate state parameter (CSRF)
        String state = generateState();
        String nonce = generateState();

        // Bind every security-sensitive authorization parameter to the single-use state.
        oauthStateCache.put("oauth2:state:" + state,
            new SsoStateData(config.getId(), codeVerifier, tenantId, providerType,
                validatedRedirectUri, nonce));

        // Build provider-specific authorization URL
        String authUrl = getAuthorizationEndpoint(config);

        return UriComponentsBuilder.fromUriString(authUrl)
            .queryParam("client_id", config.getClientId())
            .queryParam("redirect_uri", validatedRedirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope", "openid email profile")
            .queryParam("state", state)
            .queryParam("nonce", nonce)
            .queryParam("code_challenge", codeChallenge)
            .queryParam("code_challenge_method", "S256")
            .build()
            .toUriString();
    }

    /**
     * Handle the OAuth2 callback from the SSO provider.
     *
     * @param code        the authorization code from the provider
     * @param state       the state parameter for CSRF validation
     * @return AuthResult with CloudBuilder JWT token
     */
    @Transactional
    public AuthResult handleCallback(String code, String state) {
        // Validate state parameter
        String cacheKey = "oauth2:state:" + state;
        SsoStateData stateData = oauthStateCache.getIfPresent(cacheKey);
        if (stateData == null) {
            throw new IllegalArgumentException("Parâmetro state inválido ou expirado.");
        }
        oauthStateCache.invalidate(cacheKey);

        // Get provider config
        SsoProviderConfig config = providerConfigRepository.findById(stateData.providerConfigId())
            .orElseThrow(() -> new IllegalArgumentException("Configuração do provedor SSO não encontrada."));

        // Exchange authorization code for tokens
        Map<String, Object> tokenResponse = exchangeCodeForToken(
            config, code, stateData.redirectUri(), stateData.codeVerifier());

        // Extract ID token claims (with JWKS signature verification)
        String idToken = (String) tokenResponse.get("id_token");
        Map<String, Object> claims = decodeIdToken(idToken, config, stateData.nonce());

        String email = (String) claims.get("email");
        String name = (String) claims.getOrDefault("name", email);
        String providerType = config.getProviderType();

        if (email == null) {
            throw new IllegalArgumentException("Token ID não contém email.");
        }

        // Validate email domain against allowed domains
        String allowedDomains = config.getAllowedDomains();
        if (allowedDomains != null && !allowedDomains.isBlank()) {
            String emailDomain = email.substring(email.indexOf('@') + 1);
            boolean domainAllowed = Arrays.stream(allowedDomains.split(","))
                .map(String::trim)
                .anyMatch(d -> d.equalsIgnoreCase(emailDomain));
            if (!domainAllowed) {
                throw new IllegalArgumentException(
                    "Domínio de email não autorizado para SSO: " + emailDomain);
            }
        }

        // Find or create user
        User user = provisionUser(email, name, stateData.tenantId(), providerType);

        // Resolve actual role from DB instead of hardcoded VIEWER
        Set<String> roles = roleRepository.findByTenantIdAndName(stateData.tenantId(), "viewer")
            .map(r -> Set.of(r.getName()))
            .orElse(Set.of("VIEWER"));

        // Generate CloudBuilder JWT with resolved roles
        String accessToken = jwtTokenProvider.generateAccessToken(
            user.getId(), user.getEmail(), roles, stateData.tenantId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        log.info("SSO login successful for user '{}' via provider '{}' for tenant '{}'",
            email, providerType, stateData.tenantId());

        return new AuthResult(accessToken, refreshToken, 900000,
            user.getId(), user.getName(), user.getEmail(), roles,
            stateData.tenantId(), stateData.redirectUri());
    }

    /**
     * Exchange the authorization code for access and ID tokens.
     */
    private Map<String, Object> exchangeCodeForToken(SsoProviderConfig config,
                                                      String code, String redirectUri,
                                                      String codeVerifier) {
        String tokenUrl = getTokenEndpoint(config);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = "grant_type=authorization_code"
            + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
            + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
            + "&client_id=" + URLEncoder.encode(config.getClientId(), StandardCharsets.UTF_8)
            + "&client_secret=" + URLEncoder.encode(config.getClientSecret(), StandardCharsets.UTF_8)
            + "&code_verifier=" + URLEncoder.encode(codeVerifier, StandardCharsets.UTF_8);

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            tokenUrl, HttpMethod.POST, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Falha na troca do código de autorização.");
        }

        return response.getBody();
    }

    /**
     * Find or create a user from SSO claims.
     */
    private User provisionUser(String email, String name, String tenantId, String providerType) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            // Verify tenant link
            Optional<TenantUser> tu = tenantUserRepository
                .findByTenantIdAndUserId(tenantId, user.getId());
            if (tu.isEmpty()) {
                // Link user to this tenant with VIEWER role
                var viewerRole = roleRepository.findByTenantIdAndName(tenantId, "viewer")
                    .orElseThrow(() -> new RuntimeException("Role 'viewer' não encontrada."));
                tenantUserRepository.save(new TenantUser(tenantId, user.getId(), viewerRole.getId()));
            }
            user.setSsoOnly(true);
            user.setSsoProvider(providerType);
            user.setUpdatedAt(Instant.now());
            return userRepository.save(user);
        }

        // Create new user
        User newUser = new User(email, "", name);
        newUser.setSsoOnly(true);
        newUser.setSsoProvider(providerType);
        newUser = userRepository.save(newUser);

        // Link to tenant with VIEWER role
        var viewerRole = roleRepository.findByTenantIdAndName(tenantId, "viewer")
            .orElseThrow(() -> new RuntimeException("Role 'viewer' não encontrada."));
        tenantUserRepository.save(new TenantUser(tenantId, newUser.getId(), viewerRole.getId()));

        log.info("Auto-provisioned SSO user '{}' via provider '{}' for tenant '{}'",
            email, providerType, tenantId);

        return newUser;
    }

    /**
     * Generate a cryptographically random state parameter.
     */
    private String generateState() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        var sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    /**
     * Generate a PKCE code verifier (random 43-character URL-safe string).
     */
    private String generateCodeVerifier() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Generate a PKCE code challenge = BASE64URL(SHA256(code_verifier)).
     */
    private String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar code_challenge PKCE", e);
        }
    }

    /**
     * Decode a JWT ID token payload using Jackson ObjectMapper,
     * with signature verification via JWKS per ADR-025 audit (H1).
     * <p>
     * Fetches the provider's JWKS from its well-known endpoint and verifies
     * the JWT signature against the public key matching the {@code kid} header.
     *
     * @param idToken      the raw JWT ID token from the provider
     * @param config       configured OIDC provider
     * @param expectedNonce nonce bound to the authorization request
     * @return decoded claims
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> decodeIdToken(String idToken, SsoProviderConfig config,
                                              String expectedNonce) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Resposta OIDC sem ID token.");
        }
        String[] parts = idToken.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("ID token inválido.");
        }

        String jwksUrl = getJwksUrl(config);
        if (!jwksVerifier.verify(idToken, jwksUrl)) {
            throw new SecurityException("Assinatura do ID token inválida — possível adulteração.");
        }

        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payload, LinkedHashMap.class);
            validateIdTokenClaims(claims, config, expectedNonce);
            return claims;
        } catch (Exception e) {
            if (e instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
            if (e instanceof SecurityException securityException) {
                throw securityException;
            }
            throw new IllegalArgumentException("Falha ao decodificar ID token.", e);
        }
    }

    private String getAuthorizationEndpoint(SsoProviderConfig config) {
        return switch (config.getProviderType().toLowerCase()) {
            case "google" -> "https://accounts.google.com/o/oauth2/v2/auth";
            case "azure" -> "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
            case "okta" -> oktaIssuer(config) + "/v1/authorize";
            default -> throw new IllegalArgumentException(
                "Provedor SSO não suportado: " + config.getProviderType());
        };
    }

    private String getTokenEndpoint(SsoProviderConfig config) {
        return switch (config.getProviderType().toLowerCase()) {
            case "google" -> "https://oauth2.googleapis.com/token";
            case "azure" -> "https://login.microsoftonline.com/common/oauth2/v2.0/token";
            case "okta" -> oktaIssuer(config) + "/v1/token";
            default -> throw new IllegalArgumentException(
                "Provedor SSO não suportado: " + config.getProviderType());
        };
    }

    private static String getJwksUrl(SsoProviderConfig config) {
        return switch (config.getProviderType().toLowerCase()) {
            case "google" -> "https://www.googleapis.com/oauth2/v3/certs";
            case "azure" -> "https://login.microsoftonline.com/common/discovery/v2.0/keys";
            case "okta" -> oktaIssuer(config) + "/v1/keys";
            default -> throw new IllegalArgumentException(
                "Provedor SSO não suportado: " + config.getProviderType());
        };
    }

    private String validateRedirectUri(String redirectUri) {
        if (redirectUri == null || redirectUri.isBlank()) {
            throw new IllegalArgumentException("redirect_uri é obrigatório.");
        }
        URI uri;
        try {
            uri = URI.create(redirectUri).normalize();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("redirect_uri inválido.", e);
        }
        if (!uri.isAbsolute() || uri.getFragment() != null || uri.getUserInfo() != null) {
            throw new IllegalArgumentException("redirect_uri inválido.");
        }
        boolean allowed = Arrays.stream(allowedRedirectUris.split(","))
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .anyMatch(uri.toString()::equals);
        if (!allowed) {
            throw new IllegalArgumentException("redirect_uri não autorizado.");
        }
        return uri.toString();
    }

    private static String oktaIssuer(SsoProviderConfig config) {
        String metadataUrl = config.getMetadataUrl();
        if (metadataUrl == null || metadataUrl.isBlank()) {
            throw new IllegalArgumentException(
                "metadataUrl do Okta é obrigatório e deve apontar para o issuer OIDC.");
        }
        URI uri = URI.create(metadataUrl).normalize();
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || uri.getUserInfo() != null || uri.getFragment() != null) {
            throw new IllegalArgumentException("metadataUrl do Okta inválido.");
        }
        String issuer = uri.toString();
        String discoverySuffix = "/.well-known/openid-configuration";
        if (issuer.endsWith(discoverySuffix)) {
            issuer = issuer.substring(0, issuer.length() - discoverySuffix.length());
        }
        return issuer.endsWith("/") ? issuer.substring(0, issuer.length() - 1) : issuer;
    }

    private static void validateIdTokenClaims(Map<String, Object> claims,
                                              SsoProviderConfig config,
                                              String expectedNonce) {
        Object audience = claims.get("aud");
        boolean audienceMatches = config.getClientId().equals(audience)
            || (audience instanceof Collection<?> values && values.contains(config.getClientId()));
        if (!audienceMatches) {
            throw new SecurityException("Audience do ID token inválida.");
        }
        if (audience instanceof Collection<?> values && values.size() > 1
                && !config.getClientId().equals(claims.get("azp"))) {
            throw new SecurityException("Authorized party do ID token inválida.");
        }
        Object expiration = claims.get("exp");
        if (!(expiration instanceof Number exp)
                || Instant.now().getEpochSecond() >= exp.longValue()) {
            throw new SecurityException("ID token expirado ou sem expiração válida.");
        }
        if (!Objects.equals(expectedNonce, claims.get("nonce"))) {
            throw new SecurityException("Nonce do ID token inválido.");
        }
        if (!(claims.get("sub") instanceof String subject) || subject.isBlank()) {
            throw new SecurityException("ID token sem subject válido.");
        }
        String issuer = Objects.toString(claims.get("iss"), "");
        boolean issuerMatches = switch (config.getProviderType().toLowerCase()) {
            case "google" -> issuer.equals("https://accounts.google.com")
                || issuer.equals("accounts.google.com");
            case "azure" -> issuer.startsWith("https://login.microsoftonline.com/")
                && issuer.endsWith("/v2.0");
            case "okta" -> issuer.equals(oktaIssuer(config));
            default -> false;
        };
        if (!issuerMatches) {
            throw new SecurityException("Issuer do ID token inválido.");
        }
    }

    /**
     * Result of a successful SSO authentication flow.
     */
    public record AuthResult(
        String accessToken,
        String refreshToken,
        long expiresIn,
        String userId,
        String name,
        String email,
        Set<String> roles,
        String tenantId,
        String redirectUri
    ) {}

    /**
     * Refresh tokens for an SSO-authenticated user.
     * Validates the current refresh token and issues a new access + refresh token pair.
     */
    public Map<String, Object> refreshToken(String refreshToken) {
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Token de refresh inválido ou expirado.");
        }

        String userId = jwtTokenProvider.getUserId(refreshToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        // Find tenant association
        var tenantUsers = tenantUserRepository.findByUserId(user.getId());
        if (tenantUsers.isEmpty()) {
            throw new RuntimeException("Usuário não vinculado a nenhuma organização.");
        }
        var tu = tenantUsers.get(0);

        // Resolve role from DB
        Set<String> roles = roleRepository.findById(tu.getRoleId())
            .map(r -> Set.of(r.getName()))
            .orElse(Set.of("VIEWER"));

        // Generate new token pair
        String newAccessToken = jwtTokenProvider.generateAccessToken(
            user.getId(), user.getEmail(), roles, tu.getTenantId());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        log.info("Token refreshed for SSO user '{}'", user.getEmail());

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("accessToken", newAccessToken);
        result.put("refreshToken", newRefreshToken);
        result.put("expiresIn", 900000);
        return result;
    }
}
