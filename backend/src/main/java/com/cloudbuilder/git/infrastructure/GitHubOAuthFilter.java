package com.cloudbuilder.git.infrastructure;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
@Order(1)
public class GitHubOAuthFilter implements Filter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/api/v1/git/connect",
            "/api/v1/github/auth",
            "/api/v1/github/callback"
    );

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI();

        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (path.startsWith("/api/v1/git/") || path.startsWith("/api/v1/github/")) {
            HttpSession session = request.getSession(false);
            String token = session != null ? (String) session.getAttribute("github_token") : null;

            if (token == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                }
            }

            if (token == null || token.isBlank()) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"erro\":\"Token de acesso GitHub não encontrado. " +
                        "Conecte-se via /api/v1/github/auth primeiro.\"}");
                return;
            }

            request.setAttribute("github_token", token);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::equals);
    }
}
