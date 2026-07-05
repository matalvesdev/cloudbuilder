package com.cloudbuilder.shared.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM converter for encrypting sensitive fields (OAuth client secrets, tokens).
 * Uses a 256-bit key derived from the configured master key.
 * 
 * Security properties:
 * - AES-256-GCM: authenticated encryption (integrity + confidentiality)
 * - Random 12-byte IV per encryption (nonce reuse resistant)
 * - Base64-encoded ciphertext: IV + ciphertext + GCM tag
 * 
 * WARNING: Requires JCE Unlimited Strength Jurisdiction Policy for 256-bit keys.
 */
@Converter
public class SecretEncryptionConverter implements AttributeConverter<String, String> {

    private static final Logger log = LoggerFactory.getLogger(SecretEncryptionConverter.class);
    private static final String AES_GCM_NO_PADDING = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    // Master encryption key — must be set via CLOUDBUILDER_ENCRYPTION_KEY env var
    private static final String MASTER_KEY_ENV = "CLOUDBUILDER_ENCRYPTION_KEY";
    private static final String PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA256";
    private static final int PBKDF2_ITERATIONS = 600_000; // OWASP 2023 recommended minimum
    private static final int KEY_LENGTH = 256;
    private static final SecretKey SECRET_KEY;

    static {
        String envKey = System.getenv(MASTER_KEY_ENV);
        if (envKey == null || envKey.isBlank()) {
            throw new IllegalStateException(
                MASTER_KEY_ENV + " environment variable is required. " +
                "Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\""
            );
        }
        byte[] keyBytes;
        try {
            // Derive 256-bit AES key from the env var using PBKDF2-HMAC-SHA256
            // Uses a static app-specific salt (not secret, different per application)
            SecretKeyFactory factory = SecretKeyFactory.getInstance(PBKDF2_ALGORITHM);
            byte[] salt = "CloudBuilder-AES256-GCM".getBytes(StandardCharsets.UTF_8);
            PBEKeySpec spec = new PBEKeySpec(envKey.toCharArray(), salt, PBKDF2_ITERATIONS, KEY_LENGTH);
            keyBytes = factory.generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new RuntimeException("Falha ao derivar chave de criptografia com PBKDF2", e);
        }
        SECRET_KEY = new SecretKeySpec(keyBytes, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) return null;
        try {
            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom.getInstanceStrong().nextBytes(iv);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, SECRET_KEY, spec);
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());
            byte[] combined = new byte[GCM_IV_LENGTH + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, GCM_IV_LENGTH);
            System.arraycopy(ciphertext, 0, combined, GCM_IV_LENGTH, ciphertext.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            log.error("Failed to encrypt secret", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(encrypted);
            Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, combined, 0, GCM_IV_LENGTH);
            cipher.init(Cipher.DECRYPT_MODE, SECRET_KEY, spec);
            byte[] plaintext = cipher.doFinal(combined, GCM_IV_LENGTH, combined.length - GCM_IV_LENGTH);
            return new String(plaintext);
        } catch (Exception e) {
            log.error("Failed to decrypt secret", e);
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
