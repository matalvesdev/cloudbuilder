package com.cloudbuilder.shared.api;

/**
 * Thrown when a client requests an unsupported API version.
 * Results in a 406 Not Acceptable response.
 */
public class UnsupportedApiVersionException extends RuntimeException {

    private final String requestedVersion;

    public UnsupportedApiVersionException(String requestedVersion) {
        super("Versão de API não suportada: " + requestedVersion
            + ". Versões suportadas: v1, v2");
        this.requestedVersion = requestedVersion;
    }

    public String getRequestedVersion() {
        return requestedVersion;
    }
}
