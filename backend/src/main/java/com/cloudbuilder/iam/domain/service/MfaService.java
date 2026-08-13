package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.UserMfa;
import com.cloudbuilder.iam.domain.model.MfaSecretCodec;
import com.cloudbuilder.iam.domain.port.UserMfaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

/**
 * Multi-Factor Authentication service using TOTP (Time-based One-Time Password).
 * Compatible with Google Authenticator, Authy, and other TOTP apps.
 *
 * TIER 0 reference: RFC 6238 (TOTP) — https://datatracker.ietf.org/doc/html/rfc6238
 */
@Service
@Transactional
public class MfaService {

    private static final Logger log = LoggerFactory.getLogger(MfaService.class);

    private final UserMfaRepository userMfaRepository;

    // TOTP constants (RFC 6238)
    private static final int TOTP_TIME_STEP = 30; // seconds
    private static final int TOTP_CODE_DIGITS = 6;
    private static final String HMAC_ALGORITHM = "HmacSHA1";

    public MfaService(UserMfaRepository userMfaRepository) {
        this.userMfaRepository = userMfaRepository;
    }

    /**
     * Setup MFA for a user. Generates a new secret and backup codes.
     * MFA remains disabled until verified via verifyAndEnable().
     */
    public UserMfa setupMfa(String userId) {
        // Check if MFA already exists for this user
        var existing = userMfaRepository.findByUserId(userId);
        if (existing.isPresent()) {
            var mfa = existing.get();
            if (mfa.isEnabled()) {
                throw new IllegalStateException("MFA já está habilitado para este usuário. Desabilite antes de reconfigurar.");
            }
            // Generate new secret for existing disabled MFA
            mfa.setSecret(generateRandomSecret());
            mfa.setBackupCodes(generateBackupCodesString());
            return userMfaRepository.save(mfa);
        }

        var mfa = new UserMfa(userId);
        return userMfaRepository.save(mfa);
    }

    /**
     * Verify a TOTP code and enable MFA if correct.
     * This is the verification step that enables MFA after setup.
     */
    public UserMfa verifyAndEnable(String userId, String code) {
        var mfa = userMfaRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("MFA não configurado para este usuário."));

        if (mfa.isEnabled()) {
            throw new IllegalStateException("MFA já está habilitado.");
        }

        if (!verifyCode(mfa.getSecret(), code)) {
            throw new IllegalArgumentException("Código MFA inválido.");
        }

        mfa.setEnabled(true);
        mfa.setLastVerifiedAt(Instant.now());
        log.info("MFA enabled for user {}", userId);
        return userMfaRepository.save(mfa);
    }

    /**
     * Verify a TOTP code against the stored secret for an already-enabled user.
     * Also checks backup codes.
     */
    public boolean verify(String userId, String code) {
        var mfa = userMfaRepository.findByUserId(userId)
                .orElse(null);

        if (mfa == null || !mfa.isEnabled()) {
            return true; // MFA not enabled — no verification needed
        }

        // Check if it's a valid TOTP code
        if (verifyCode(mfa.getSecret(), code)) {
            mfa.setLastVerifiedAt(Instant.now());
            userMfaRepository.save(mfa);
            return true;
        }

        // Check backup codes
        if (verifyBackupCode(mfa, code)) {
            mfa.setLastVerifiedAt(Instant.now());
            userMfaRepository.save(mfa);
            return true;
        }

        return false;
    }

    /**
     * Disable MFA for a user.
     */
    public void disableMfa(String userId) {
        var mfa = userMfaRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("MFA não configurado para este usuário."));
        mfa.setEnabled(false);
        userMfaRepository.save(mfa);
        log.info("MFA disabled for user {}", userId);
    }

    /**
     * Get MFA status for a user.
     */
    @Transactional(readOnly = true)
    public UserMfa getMfaStatus(String userId) {
        return userMfaRepository.findByUserId(userId).orElse(null);
    }

    /**
     * Verify a TOTP code.
     * Uses a window of ±1 time step (90s total) to account for clock drift.
     */
    private boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) return false;

        byte[] secretBytes = MfaSecretCodec.decode(secret);
        long timeWindow = Instant.now().getEpochSecond() / TOTP_TIME_STEP;

        // Check current, previous, and next time window (30s × 3 = 90s tolerance)
        for (int i = -1; i <= 1; i++) {
            String expected = generateTOTP(secretBytes, timeWindow + i);
            if (constantTimeEquals(expected, code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate a TOTP code per RFC 6238.
     */
    private String generateTOTP(byte[] secret, long timeWindow) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));

            // Convert time window to 8-byte big-endian
            ByteBuffer buffer = ByteBuffer.allocate(8);
            buffer.putLong(timeWindow);
            byte[] hash = mac.doFinal(buffer.array());

            // Dynamic truncation (RFC 4226)
            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);

            int otp = binary % (int) Math.pow(10, TOTP_CODE_DIGITS);
            return String.format("%0" + TOTP_CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            log.error("TOTP generation error: {}", e.getMessage());
            return "";
        }
    }

    private boolean verifyBackupCode(UserMfa mfa, String code) {
        if (mfa.getBackupCodes() == null || code == null) return false;

        String[] codes = mfa.getBackupCodes().split(",");
        List<String> remaining = new ArrayList<>();
        boolean found = false;

        for (String backupCode : codes) {
            if (backupCode.equals(code) && !found) {
                found = true; // Consume this code
            } else {
                remaining.add(backupCode);
            }
        }

        if (found) {
            mfa.setBackupCodes(String.join(",", remaining));
            userMfaRepository.save(mfa);
        }

        return found;
    }

    private static String generateRandomSecret() {
        return MfaSecretCodec.generate();
    }

    private static String generateBackupCodesString() {
        SecureRandom random = new SecureRandom();
        StringBuilder codes = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            if (i > 0) codes.append(",");
            byte[] codeBytes = new byte[6];
            random.nextBytes(codeBytes);
            String code = HexFormat.of().formatHex(codeBytes)
                    .substring(0, 8).toUpperCase();
            codes.append(code);
        }
        return codes.toString();
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
