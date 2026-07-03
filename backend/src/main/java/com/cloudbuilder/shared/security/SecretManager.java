package com.cloudbuilder.shared.security;

import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * SecretManager: Abstraction for secret storage and retrieval.
 * Uses AES-256-GCM encryption for local secret storage.
 * Can be extended to integrate with external vault providers (HashiCorp Vault, AWS Secrets Manager, etc.).
 */
@Component
public class SecretManager {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 16;
    private static final int TAG_LENGTH_BIT = 128;
    private static final int KEY_LENGTH_BIT = 256;
    private static final int ITERATION_COUNT = 600_000;

    private final String encryptionKey;

    public SecretManager() {
        this.encryptionKey = System.getenv().getOrDefault("CLOUDBUILDER_ENCRYPTION_KEY", "cloudbuilder-default-dev-key");
    }

    /**
     * Encrypt a secret value.
     */
    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            SecretKeySpec keySpec = deriveKey(encryptionKey);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt secret", e);
        }
    }

    /**
     * Decrypt a secret value.
     */
    public String decrypt(String ciphertext) {
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv = new byte[IV_LENGTH];
            byte[] encrypted = new byte[combined.length - IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, iv.length);
            System.arraycopy(combined, iv.length, encrypted, 0, encrypted.length);

            SecretKeySpec keySpec = deriveKey(encryptionKey);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt secret", e);
        }
    }

    /**
     * Check if a value appears to be encrypted.
     */
    public boolean isEncrypted(String value) {
        if (value == null || value.isEmpty()) return false;
        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            return decoded.length > IV_LENGTH;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private SecretKeySpec deriveKey(String password) throws Exception {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), "cloudbuilder-salt".getBytes(), ITERATION_COUNT, KEY_LENGTH_BIT);
        SecretKey tmp = factory.generateSecret(spec);
        return new SecretKeySpec(tmp.getEncoded(), "AES");
    }
}
