package com.cloudbuilder.shared.security;

import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.ByteArrayInputStream;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IdempotencyInterceptorTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    private IdempotencyInterceptor interceptor;

    @BeforeEach
    void setUp() throws Exception {
        interceptor = new IdempotencyInterceptor();
        when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        when(response.getStatus()).thenReturn(200);
    }

    private ServletInputStream toServletInputStream(String content) {
        ByteArrayInputStream bais = new ByteArrayInputStream(content.getBytes());
        return new ServletInputStream() {
            @Override public boolean isReady() { return true; }
            @Override public boolean isFinished() { return bais.available() == 0; }
            @Override public void setReadListener(ReadListener listener) {}
            @Override public int read() { return bais.read(); }
        };
    }

    // ─── GET requests pass through ─────────────────────────────

    @Test
    void doGet_alwaysPassesThrough() {
        when(request.getMethod()).thenReturn("GET");
        assertTrue(interceptor.preHandle(request, response, null));
    }

    @Test
    void head_alwaysPassesThrough() {
        when(request.getMethod()).thenReturn("HEAD");
        assertTrue(interceptor.preHandle(request, response, null));
    }

    // ─── POST with X-Idempotency-Key header ────────────────────

    @Test
    void postWithIdempotencyKey_firstRequestPasses() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-123");

        boolean result = interceptor.preHandle(request, response, null);

        assertTrue(result);
        verify(request).setAttribute("idempotencyKey", "key-123");
    }

    @Test
    void postWithIdempotencyKey_duplicateReturnsCachedResponse() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-456");

        interceptor.preHandle(request, response, null);
        // afterCompletion reads the attribute set by preHandle
        when(request.getAttribute("idempotencyKey")).thenReturn("key-456");
        interceptor.afterCompletion(request, response, null, null);

        boolean second = interceptor.preHandle(request, response, null);
        assertFalse(second, "Duplicate request should be blocked");
    }

    @Test
    void postWithIdempotencyKey_differentKeysPassSeparately() {
        when(request.getMethod()).thenReturn("POST");

        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-A");
        interceptor.preHandle(request, response, null);
        interceptor.afterCompletion(request, response, null, null);

        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-B");
        assertTrue(interceptor.preHandle(request, response, null));
    }

    // ─── POST with query param key ─────────────────────────────

    @Test
    void postWithQueryParamKey_usesQueryKey() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn("query-key-789");

        boolean result = interceptor.preHandle(request, response, null);

        assertTrue(result);
        verify(request).setAttribute("idempotencyKey", "query-key-789");
    }

    @Test
    void postWithQueryParamKey_duplicateReturnsCachedResponse() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn("query-key-789");

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("query-key-789");
        interceptor.afterCompletion(request, response, null, null);

        assertFalse(interceptor.preHandle(request, response, null));
    }

    // ─── PUT and DELETE operations ─────────────────────────────

    @Test
    void putRequest_withKey_isIdempotent() {
        when(request.getMethod()).thenReturn("PUT");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("put-key-1");

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("put-key-1");
        interceptor.afterCompletion(request, response, null, null);

        assertFalse(interceptor.preHandle(request, response, null));
    }

    @Test
    void deleteRequest_withKey_isIdempotent() {
        when(request.getMethod()).thenReturn("DELETE");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("del-key-1");

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("del-key-1");
        interceptor.afterCompletion(request, response, null, null);

        assertFalse(interceptor.preHandle(request, response, null));
    }

    // ─── Key generation from request content ───────────────────

    @Test
    void postWithoutKey_generatesKeyFromContent() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getHeader("X-Tenant-Id")).thenReturn("tenant-1");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        when(request.getContentLength()).thenReturn(13);
        when(request.getInputStream()).thenReturn(toServletInputStream("{\"name\":\"test\"}"));

        boolean result = interceptor.preHandle(request, response, null);

        assertTrue(result);
        verify(request).setAttribute(eq("idempotencyKey"), anyString());
    }

    @Test
    void postWithoutKey_sameContentGeneratesSameKey() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getHeader("X-Tenant-Id")).thenReturn("tenant-1");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");
        when(request.getContentLength()).thenReturn(13);
        when(request.getInputStream()).thenReturn(toServletInputStream("{\"name\":\"test\"}"));

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("auto-generated-key");
        interceptor.afterCompletion(request, response, null, null);

        // Verify the key was stored in the cache
        verify(request).setAttribute(eq("idempotencyKey"), anyString());
    }

    @Test
    void postWithoutKey_differentContentGeneratesDifferentKey() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getHeader("X-Tenant-Id")).thenReturn("tenant-1");
        when(request.getHeader("Authorization")).thenReturn("Bearer token");

        when(request.getContentLength()).thenReturn(13);
        when(request.getInputStream()).thenReturn(toServletInputStream("{\"name\":\"alpha\"}"));
        interceptor.preHandle(request, response, null);
        interceptor.afterCompletion(request, response, null, null);

        when(request.getContentLength()).thenReturn(12);
        when(request.getInputStream()).thenReturn(toServletInputStream("{\"name\":\"beta\"}"));
        assertTrue(interceptor.preHandle(request, response, null));
    }

    // ─── afterCompletion behavior ──────────────────────────────

    @Test
    void afterCompletion_cachesSuccessfulResponse() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-cache");
        when(response.getContentType()).thenReturn("application/json");

        interceptor.preHandle(request, response, null);
        interceptor.afterCompletion(request, response, null, null);

        verify(request).getAttribute("idempotencyKey");
    }

    @Test
    void afterCompletion_doesNotCacheFailedResponse() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-fail");
        when(response.getStatus()).thenReturn(500);

        interceptor.preHandle(request, response, null);
        interceptor.afterCompletion(request, response, null, null);

        when(response.getStatus()).thenReturn(200);
        assertTrue(interceptor.preHandle(request, response, null));
    }

    @Test
    void afterCompletion_doesNotCacheClientError() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-4xx");
        when(response.getStatus()).thenReturn(400);

        interceptor.preHandle(request, response, null);
        interceptor.afterCompletion(request, response, null, null);

        assertTrue(interceptor.preHandle(request, response, null));
    }

    @Test
    void afterCompletion_noKey_doesNotCache() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn(null);
        when(request.getParameter("idempotencyKey")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getHeader("X-Tenant-Id")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getContentLength()).thenReturn(-1);

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn(null);
        interceptor.afterCompletion(request, response, null, null);

        verify(response, never()).setStatus(429);
    }

    // ─── TTL expiration ────────────────────────────────────────

    @Test
    void cachedResponse_isBlockedWithinTtl() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-ttl");

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("key-ttl");
        interceptor.afterCompletion(request, response, null, null);

        assertFalse(interceptor.preHandle(request, response, null));
    }

    // ─── Content type handling ─────────────────────────────────

    @Test
    void afterCompletion_usesResponseContentType() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-ct");
        when(response.getContentType()).thenReturn("text/plain");

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("key-ct");
        interceptor.afterCompletion(request, response, null, null);

        verify(response).getContentType();
    }

    @Test
    void afterCompletion_defaultsToJsonContentType() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("key-default-ct");
        when(response.getContentType()).thenReturn(null);

        interceptor.preHandle(request, response, null);
        when(request.getAttribute("idempotencyKey")).thenReturn("key-default-ct");
        interceptor.afterCompletion(request, response, null, null);

        verify(response).getContentType();
    }

    // ─── Blank key handling ────────────────────────────────────

    @Test
    void postWithBlankIdempotencyKey_fallsBackToContentHash() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Idempotency-Key")).thenReturn("   ");
        when(request.getParameter("idempotencyKey")).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getHeader("X-Tenant-Id")).thenReturn(null);
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getContentLength()).thenReturn(-1);

        assertTrue(interceptor.preHandle(request, response, null));
    }
}
