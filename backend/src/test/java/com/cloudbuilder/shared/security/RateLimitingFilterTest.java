package com.cloudbuilder.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitingFilterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private RateLimitingFilter filter;

    private ByteArrayOutputStream responseOutput;

    @BeforeEach
    void setUp() throws IOException {
        filter = new RateLimitingFilter();
        ReflectionTestUtils.setField(filter, "authMaxRequests", 3);
        ReflectionTestUtils.setField(filter, "authWindowSeconds", 60);
        ReflectionTestUtils.setField(filter, "globalMaxRequests", 5);
        ReflectionTestUtils.setField(filter, "globalWindowSeconds", 60);

        responseOutput = new ByteArrayOutputStream();
        ServletOutputStream outputStream = new ServletOutputStream() {
            @Override
            public boolean isReady() { return true; }
            @Override
            public void setWriteListener(WriteListener listener) {}
            @Override
            public void write(int b) { responseOutput.write(b); }
        };
        when(response.getOutputStream()).thenReturn(outputStream);
        when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
    }

    // ─── GET requests (non-auth) ───────────────────────────────

    @Test
    void doGet_requestWithinLimit_passesThrough() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response).setHeader("X-RateLimit-Limit", "5");
        verify(response).setHeader(eq("X-RateLimit-Remaining"), anyString());
    }

    @Test
    void doGet_setsCorrectHeaders() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setHeader("X-RateLimit-Limit", "5");
        verify(response).setHeader("X-RateLimit-Remaining", "4");
    }

    // ─── Global rate limiting ──────────────────────────────────

    @Test
    void globalRateLimit_exceededReturns429() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        responseOutput.reset();
        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(429);
        verify(response).setHeader("Retry-After", "60");
    }

    @Test
    void globalRateLimit_differentIPsHaveSeparateBuckets() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");

        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        when(request.getRemoteAddr()).thenReturn("192.168.1.2");
        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain, times(6)).doFilter(request, response);
    }

    // ─── Auth endpoint rate limiting ───────────────────────────

    @Test
    void authEndpoint_usesStricterLimit() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        for (int i = 0; i < 3; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        responseOutput.reset();
        filter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(429);
    }

    @Test
    void authEndpoint_setsAuthLimitHeaders() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setHeader("X-RateLimit-Limit", "3");
        verify(response).setHeader("X-RateLimit-Remaining", "2");
    }

    @Test
    void authEndpoint_variousPathsDetected() throws ServletException, IOException {
        String[] authPaths = {
            "/api/v1/auth/login", "/api/auth/login",
            "/api/v1/auth/register", "/api/auth/register",
            "/api/v1/auth/forgot-password", "/api/auth/forgot-password",
            "/api/v1/auth/reset-password", "/api/auth/reset-password",
            "/api/v1/auth/refresh", "/api/auth/refresh",
        };

        for (String path : authPaths) {
            filter = new RateLimitingFilter();
            ReflectionTestUtils.setField(filter, "authMaxRequests", 3);
            ReflectionTestUtils.setField(filter, "authWindowSeconds", 60);
            ReflectionTestUtils.setField(filter, "globalMaxRequests", 5);
            ReflectionTestUtils.setField(filter, "globalWindowSeconds", 60);

            when(request.getRequestURI()).thenReturn(path);
            when(request.getMethod()).thenReturn("POST");
            when(request.getRemoteAddr()).thenReturn("192.168.1.1");

            filter.doFilterInternal(request, response, filterChain);

            verify(response).setHeader("X-RateLimit-Limit", "3");
            reset(response);
            when(response.getOutputStream()).thenReturn(new ServletOutputStream() {
                @Override public boolean isReady() { return true; }
                @Override public void setWriteListener(WriteListener l) {}
                @Override public void write(int b) {}
            });
            when(response.getWriter()).thenReturn(new PrintWriter(new StringWriter()));
        }
    }

    @Test
    void authEndpoint_nonAuthPathsUseGlobalLimit() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases/123/provision/apply");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setHeader("X-RateLimit-Limit", "5");
    }

    // ─── IP extraction ─────────────────────────────────────────

    @Test
    void getClientIp_usesXForwardedFor() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 10.0.0.2");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void getClientIp_usesXRealIp() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn("10.0.0.3");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void getClientIp_fallsBackToRemoteAddr() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    // ─── Write operations ──────────────────────────────────────

    @Test
    void postRequest_appliesBothAuthAndGlobalLimits() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(response).setHeader("X-RateLimit-Limit", "3");
    }

    // ─── Retry-After header ────────────────────────────────────

    @Test
    void rateLimitedResponse_includesRetryAfter() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setHeader("Retry-After", "60");
    }

    @Test
    void rateLimitedResponse_hasJsonContentType() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/canvases");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        for (int i = 0; i < 5; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        filter.doFilterInternal(request, response, filterChain);

        verify(response).setContentType("application/json");
    }
}
