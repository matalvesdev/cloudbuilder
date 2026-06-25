package com.cloudbuilder.shared.api;

/**
 * Supported API versions per ADR-022.
 * Each version has an Accept header media type, a deprecation status,
 * and an optional sunset date.
 */
public enum ApiVersion {

    V1("application/vnd.cloudbuilder.v1+json", false, null),
    V2("application/vnd.cloudbuilder.v2+json", false, null);

    private final String mediaType;
    private final boolean deprecated;
    private final String sunsetDate;

    ApiVersion(String mediaType, boolean deprecated, String sunsetDate) {
        this.mediaType = mediaType;
        this.deprecated = deprecated;
        this.sunsetDate = sunsetDate;
    }

    public String getMediaType() {
        return mediaType;
    }

    public boolean isDeprecated() {
        return deprecated;
    }

    public String getSunsetDate() {
        return sunsetDate;
    }
}
