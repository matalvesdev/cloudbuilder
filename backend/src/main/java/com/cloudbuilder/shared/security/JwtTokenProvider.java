package com.cloudbuilder.shared.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;

/**
 * Native JWT provider — HMAC-SHA256, no jjwt dependency.
 * <p>
 * JWT format: {@code base64url(header).base64url(payload).base64url(signature)}
 */
@Component
public class JwtTokenProvider {

    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final String HMAC_SHA256 = "HmacSHA256";

    @Value("${cloudbuilder.security.jwt-secret}")
    private String jwtSecret;

    @Value("${cloudbuilder.security.access-token-expiration:900000}")
    private long accessTokenExpiration;

    @Value("${cloudbuilder.security.refresh-token-expiration:604800000}")
    private long refreshTokenExpiration;

    private byte[] secretBytes;

    @PostConstruct
    public void init() {
        this.secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    // ---------------------------------------------------------------
    // Token generation
    // ---------------------------------------------------------------

    public String generateAccessToken(String userId, String email, Set<String> roles) {
        return generateAccessToken(userId, email, roles, null);
    }

    public String generateAccessToken(String userId, String email, Set<String> roles, String tenantId) {
        long now = Instant.now().toEpochMilli();
        long exp = now + accessTokenExpiration;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", userId.toString());
        payload.put("email", email);
        payload.put("roles", roles);
        payload.put("iat", now / 1000);
        payload.put("exp", exp / 1000);
        if (tenantId != null) {
            payload.put("tenantId", tenantId);
        }

        return buildToken(payload);
    }

    public String generateRefreshToken(String userId) {
        long now = Instant.now().toEpochMilli();
        long exp = now + refreshTokenExpiration;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", userId.toString());
        payload.put("type", "refresh");
        payload.put("iat", now / 1000);
        payload.put("exp", exp / 1000);

        return buildToken(payload);
    }

    // ---------------------------------------------------------------
    // Validation
    // ---------------------------------------------------------------

    public boolean validateToken(String token) {
        try {
            parseAndVerify(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getUserId(String token) {
        Map<String, Object> claims = parseAndVerify(token);
        return (String) claims.get("sub");
    }

    @SuppressWarnings("unchecked")
    public Set<String> getRoles(String token) {
        Map<String, Object> claims = parseAndVerify(token);
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?> list) {
            return new HashSet<>((List<String>) list);
        }
        return Collections.emptySet();
    }

    public String getTenantId(String token) {
        Map<String, Object> claims = parseAndVerify(token);
        Object tenantId = claims.get("tenantId");
        return tenantId instanceof String s ? s : null;
    }

    // ---------------------------------------------------------------
    // Core JWT logic
    // ---------------------------------------------------------------

    private String buildToken(Map<String, Object> payload) {
        try {
            String headerB64 = base64Url(HEADER);
            String payloadB64 = base64Url(toJson(payload));
            String signature = hmacSha256(headerB64 + "." + payloadB64);
            return headerB64 + "." + payloadB64 + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseAndVerify(String token) {
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("Token cannot be null or empty");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format: expected 3 parts, got " + parts.length);
        }

        String headerB64 = parts[0];
        String payloadB64 = parts[1];
        String signature = parts[2];

        // Verify signature
        String expectedSig = hmacSha256(headerB64 + "." + payloadB64);
        if (!constantTimeEquals(signature, expectedSig)) {
            throw new SecurityException("Invalid JWT signature");
        }

        // Parse payload
        String payloadJson = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
        Map<String, Object> claims = parseJson(payloadJson);

        // Check expiration
        Object expObj = claims.get("exp");
        if (expObj instanceof Number expNum) {
            long expSeconds = expNum.longValue();
            if (Instant.now().getEpochSecond() > expSeconds) {
                throw new SecurityException("JWT expired");
            }
        }

        return claims;
    }

    // ---------------------------------------------------------------
    // HMAC-SHA256
    // ---------------------------------------------------------------

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secretBytes, HMAC_SHA256));
            return base64Url(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC-SHA256 not available", e);
        }
    }

    // ---------------------------------------------------------------
    // Constant-time comparison (timing-attack resistant)
    // ---------------------------------------------------------------

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    // ---------------------------------------------------------------
    // Base64 URL-safe (no padding)
    // ---------------------------------------------------------------

    private static String base64Url(String data) {
        return base64Url(data.getBytes(StandardCharsets.UTF_8));
    }

    private static String base64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    // ---------------------------------------------------------------
    // Minimal JSON (no Gson/Jackson dependency needed in this file)
    // ---------------------------------------------------------------

    private static String toJson(Map<String, Object> map) {
        var sb = new StringBuilder("{");
        boolean first = true;
        for (var entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(escapeJson(entry.getKey())).append("\":");
            Object value = entry.getValue();
            if (value == null) {
                sb.append("null");
            } else if (value instanceof String s) {
                sb.append("\"").append(escapeJson(s)).append("\"");
            } else if (value instanceof Number || value instanceof Boolean) {
                sb.append(value);
            } else if (value instanceof Collection<?> c) {
                sb.append("[");
                boolean firstElem = true;
                for (Object elem : c) {
                    if (!firstElem) sb.append(",");
                    firstElem = false;
                    if (elem instanceof String s) {
                        sb.append("\"").append(escapeJson(s)).append("\"");
                    } else {
                        sb.append(elem);
                    }
                }
                sb.append("]");
            } else {
                sb.append("\"").append(escapeJson(value.toString())).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseJson(String json) {
        // A simple recursive descent parser for the subset of JSON used in JWT claims.
        // This avoids any external JSON library dependency.
        Map<String, Object> result = new LinkedHashMap<>();
        if (json == null || json.isBlank()) return result;

        var chars = new CharStream(json.trim());
        if (chars.peek() != '{') throw new IllegalArgumentException("Expected JSON object");
        chars.next(); // consume '{'

        while (chars.peek() != '}' && chars.hasMore()) {
            chars.skipWhitespace();
            if (chars.peek() == '}') break;
            if (chars.peek() == ',') { chars.next(); continue; }

            // key
            String key = parseString(chars);
            chars.skipWhitespace();
            if (chars.peek() == ':') chars.next();
            chars.skipWhitespace();

            // value
            Object value = parseValue(chars);
            result.put(key, value != null ? value : "");
            chars.skipWhitespace();
            if (chars.peek() == ',') chars.next();
        }
        if (chars.peek() == '}') chars.next();
        return result;
    }

    private static String parseString(CharStream chars) {
        if (chars.peek() != '"') throw new IllegalArgumentException("Expected string");
        chars.next(); // consume opening quote
        var sb = new StringBuilder();
        while (chars.hasMore()) {
            char c = chars.next();
            if (c == '"') break;
            if (c == '\\') {
                char next = chars.next();
                sb.append(switch (next) {
                    case '"', '\\', '/' -> next;
                    case 'b' -> '\b';
                    case 'f' -> '\f';
                    case 'n' -> '\n';
                    case 'r' -> '\r';
                    case 't' -> '\t';
                    case 'u' -> {
                        String hex = "" + chars.next() + chars.next() + chars.next() + chars.next();
                        yield (char) Integer.parseInt(hex, 16);
                    }
                    default -> next;
                });
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private static Object parseValue(CharStream chars) {
        chars.skipWhitespace();
        if (chars.peek() == '"') return parseString(chars);
        if (chars.peek() == '{') return parseJson(chars.remaining());
        if (chars.peek() == '[') {
            chars.next(); // consume '['
            var list = new ArrayList<>();
            while (chars.peek() != ']' && chars.hasMore()) {
                chars.skipWhitespace();
                if (chars.peek() == ']') break;
                if (chars.peek() == ',') { chars.next(); continue; }
                list.add(parseValue(chars));
                chars.skipWhitespace();
                if (chars.peek() == ',') chars.next();
            }
            if (chars.peek() == ']') chars.next();
            return list;
        }
        // number or keyword
        var sb = new StringBuilder();
        while (chars.hasMore() && !Character.isWhitespace(chars.peek()) && ",}]".indexOf(chars.peek()) == -1) {
            sb.append(chars.next());
        }
        String word = sb.toString();
        if (word.equals("null")) return null;
        if (word.equals("true")) return Boolean.TRUE;
        if (word.equals("false")) return Boolean.FALSE;
        if (word.contains(".") || word.contains("e") || word.contains("E")) {
            try { return Double.parseDouble(word); } catch (NumberFormatException e) { return word; }
        }
        try { return Long.parseLong(word); } catch (NumberFormatException e) { return word; }
    }

    private static String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static class CharStream {
        private final String input;
        private int pos;

        CharStream(String input) { this.input = input; this.pos = 0; }

        char peek() { return pos < input.length() ? input.charAt(pos) : '\0'; }
        char next() { return input.charAt(pos++); }
        boolean hasMore() { return pos < input.length(); }
        void skipWhitespace() { while (pos < input.length() && Character.isWhitespace(input.charAt(pos))) pos++; }
        String remaining() { return input.substring(pos); }
    }
}
