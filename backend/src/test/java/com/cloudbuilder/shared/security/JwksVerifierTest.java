package com.cloudbuilder.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwksVerifierTest {

    @Mock
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JwksVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new JwksVerifier(restTemplate, objectMapper);
    }

    @Test
    void verify_WithInvalidJwtFormat_ShouldReturnFalse() {
        assertFalse(verifier.verify("invalid-token", "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithTwoPartJwt_ShouldReturnFalse() {
        assertFalse(verifier.verify("header.payload", "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithMissingKid_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"alg\":\"RS256\"}", "{}");
        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithMissingAlg_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\"}", "{}");
        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithEmptyJwksResponse_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"RS256\"}", "{}");

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn("{\"keys\":[]}");

        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithNullJwksResponse_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"RS256\"}", "{}");

        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(null);

        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithUnsupportedAlgorithm_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"HS256\"}", "{}");

        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithJwksFetchFailure_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"RS256\"}", "{}");

        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenThrow(new RuntimeException("Connection refused"));

        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_WithJwksAndKeyNotFound_ShouldReturnFalse() {
        String jwt = createMinimalJwt("{\"kid\":\"key-missing\",\"alg\":\"RS256\"}", "{}");

        String jwksJson = "{\"keys\":[{\"kid\":\"key-other\",\"kty\":\"RSA\",\"n\":\"test\",\"e\":\"AQAB\"}]}";
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(jwksJson);

        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    @Test
    void verify_ShouldCacheJwksResults() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"RS256\"}", "{}");

        String jwksJson = "{\"keys\":[{\"kid\":\"key-1\",\"kty\":\"RSA\",\"n\":\"test\",\"e\":\"AQAB\"}]}";
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(jwksJson);

        // First call — should fetch
        verifier.verify(jwt, "https://jwks.example.com/certs");
        verify(restTemplate, times(1)).getForObject(anyString(), eq(String.class));

        // Second call with same URL — should use cache, not fetch again
        verifier.verify(jwt, "https://jwks.example.com/certs");
        verify(restTemplate, times(1)).getForObject(anyString(), eq(String.class));
    }

    @Test
    void verify_WithDifferentJwksUrls_ShouldFetchSeparately() {
        String jwt = createMinimalJwt("{\"kid\":\"key-1\",\"alg\":\"RS256\"}", "{}");
        String jwt2 = createMinimalJwt("{\"kid\":\"key-2\",\"alg\":\"RS256\"}", "{}");

        String jwksJson1 = "{\"keys\":[{\"kid\":\"key-1\",\"kty\":\"RSA\",\"n\":\"test\",\"e\":\"AQAB\"}]}";
        String jwksJson2 = "{\"keys\":[{\"kid\":\"key-2\",\"kty\":\"RSA\",\"n\":\"test2\",\"e\":\"AQAB\"}]}";

        when(restTemplate.getForObject(eq("https://provider-a.com/certs"), eq(String.class)))
                .thenReturn(jwksJson1);
        when(restTemplate.getForObject(eq("https://provider-b.com/certs"), eq(String.class)))
                .thenReturn(jwksJson2);

        verifier.verify(jwt, "https://provider-a.com/certs");
        verifier.verify(jwt2, "https://provider-b.com/certs");

        verify(restTemplate, times(1)).getForObject(eq("https://provider-a.com/certs"), eq(String.class));
        verify(restTemplate, times(1)).getForObject(eq("https://provider-b.com/certs"), eq(String.class));
    }

    @Test
    void verify_WithEcAlgorithm_ShouldIndicateNotSupported() {
        // EC keys are detected but only RSA parsing is implemented
        String jwt = createMinimalJwt("{\"kid\":\"ec-key\",\"alg\":\"ES256\"}", "{}");

        String jwksJson = "{\"keys\":[{\"kid\":\"ec-key\",\"kty\":\"EC\",\"x\":\"test\",\"y\":\"test\"}]}";
        when(restTemplate.getForObject(anyString(), eq(String.class))).thenReturn(jwksJson);

        // verify should attempt parsing but fail on EC key type (only RSA supported)
        assertFalse(verifier.verify(jwt, "https://jwks.example.com/certs"));
    }

    /**
     * Create a minimal 3-part JWT with the given header and payload JSON.
     * The signature is a dummy base64-encoded value (will fail verification).
     */
    private String createMinimalJwt(String headerJson, String payloadJson) {
        String header = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(headerJson.getBytes());
        String payload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes());
        String signature = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("dummy-signature".getBytes());
        return header + "." + payload + "." + signature;
    }
}
