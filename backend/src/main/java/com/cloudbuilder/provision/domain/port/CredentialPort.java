package com.cloudbuilder.provision.domain.port;

/**
 * Port for credential management operations.
 * Implemented by credential adapter in infrastructure layer.
 */
public interface CredentialPort {
    /** Store encrypted credentials for a provider. */
    String storeCredential(String providerType, String tenantId, String name, String encryptedPayload);

    /** Retrieve credentials by ID. */
    String getCredential(String credentialId);

    /** Test if credentials are valid for a provider. */
    boolean testConnection(String credentialId);

    /** Delete credentials. */
    void deleteCredential(String credentialId);
}
