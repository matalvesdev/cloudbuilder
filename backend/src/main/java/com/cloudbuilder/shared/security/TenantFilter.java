package com.cloudbuilder.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class TenantFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public TenantFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String requestedTenantId = request.getHeader("X-Tenant-Id");

            if (requestedTenantId == null || requestedTenantId.isBlank()) {
                requestedTenantId = request.getParameter("tenantId");
            }

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    String jwtTenantId = jwtTokenProvider.getTenantId(token);
                    if (jwtTenantId != null && !jwtTenantId.isBlank()) {
                        if (requestedTenantId != null && !requestedTenantId.isBlank()
                                && !jwtTenantId.equals(requestedTenantId)) {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType("application/json");
                            response.getWriter().write(
                                "{\"error\":\"requested tenant does not match JWT tenant\"}");
                            return;
                        }
                        TenantContext.setTenantId(jwtTenantId);
                    }
                } catch (RuntimeException invalidToken) {
                    // JwtAuthenticationFilter produces the canonical unauthorized response.
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
