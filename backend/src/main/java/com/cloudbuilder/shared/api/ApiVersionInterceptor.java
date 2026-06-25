package com.cloudbuilder.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor that resolves the API version from the Accept header
 * and sets it as a request attribute. Also adds deprecation/sunset
 * headers for deprecated versions per ADR-022.
 */
@Component
public class ApiVersionInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(ApiVersionInterceptor.class);

    public static final String API_VERSION_ATTRIBUTE = "apiVersion";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        String accept = request.getHeader("Accept");
        ApiVersion version = ApiVersionResolver.resolve(accept);
        request.setAttribute(API_VERSION_ATTRIBUTE, version);

        if (version.isDeprecated()) {
            response.setHeader("Deprecated", "true");
            if (version.getSunsetDate() != null) {
                response.setHeader("Sunset", version.getSunsetDate());
            }
            // Find successor version
            for (ApiVersion v : ApiVersion.values()) {
                if (v != version && !v.isDeprecated()) {
                    response.setHeader("Link",
                        "</api/v1/>; rel=\"successor-version\"");
                    break;
                }
            }
            log.warn("Deprecated API version '{}' used by {} {}",
                version.getMediaType(), request.getMethod(), request.getRequestURI());
        }

        return true;
    }
}
