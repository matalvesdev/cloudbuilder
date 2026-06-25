package com.cloudbuilder.shared.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Resolves the API version from the HTTP Accept header.
 *
 * Per ADR-022, the Accept header format is:
 *   Accept: application/vnd.cloudbuilder.v2+json
 *
 * If no supported version is found, returns the latest stable version (v1).
 */
public final class ApiVersionResolver {

    private static final Logger log = LoggerFactory.getLogger(ApiVersionResolver.class);

    private ApiVersionResolver() {
        // Utility class
    }

    /**
     * Resolve the API version from the Accept header value.
     *
     * @param acceptHeader the value of the Accept header (may be null)
     * @return the resolved ApiVersion, never null (defaults to V1)
     */
    public static ApiVersion resolve(String acceptHeader) {
        if (acceptHeader == null || acceptHeader.isBlank()) {
            return ApiVersion.V1;
        }

        for (ApiVersion version : ApiVersion.values()) {
            if (acceptHeader.contains(version.getMediaType())) {
                if (version.isDeprecated()) {
                    log.warn("Deprecated API version requested: {}", version.getMediaType());
                }
                return version;
            }
        }

        log.debug("Unknown Accept header value '{}', defaulting to v1", acceptHeader);
        return ApiVersion.V1;
    }

    /**
     * Check if the given Accept header value is explicitly requesting
     * a version that exists (not just defaulting).
     */
    public static boolean hasSupportedVersion(String acceptHeader) {
        if (acceptHeader == null || acceptHeader.isBlank()) {
            return true; // defaults to V1
        }
        for (ApiVersion version : ApiVersion.values()) {
            if (acceptHeader.contains(version.getMediaType())) {
                return true;
            }
        }
        return false;
    }
}
