package com.cloudbuilder.iam.domain.model;

import java.io.ByteArrayOutputStream;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Encodes TOTP secrets using unpadded RFC 4648 Base32, as expected by
 * authenticator applications. Decoding retains compatibility with legacy
 * Base64 secrets already stored by earlier CloudBuilder versions.
 */
public final class MfaSecretCodec {

    private static final char[] ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();

    private MfaSecretCodec() {
    }

    public static String generate() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public static byte[] decode(String value) {
        if (value != null && value.matches("[A-Z2-7]+")) {
            return decodeBase32(value);
        }
        return Base64.getDecoder().decode(value);
    }

    private static String encodeBase32(byte[] input) {
        StringBuilder output = new StringBuilder((input.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte current : input) {
            buffer = (buffer << 8) | (current & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                output.append(ALPHABET[(buffer >> (bitsLeft - 5)) & 0x1f]);
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            output.append(ALPHABET[(buffer << (5 - bitsLeft)) & 0x1f]);
        }
        return output.toString();
    }

    private static byte[] decodeBase32(String input) {
        ByteArrayOutputStream output = new ByteArrayOutputStream(input.length() * 5 / 8);
        int buffer = 0;
        int bitsLeft = 0;
        for (char current : input.toCharArray()) {
            int value;
            if (current >= 'A' && current <= 'Z') {
                value = current - 'A';
            } else if (current >= '2' && current <= '7') {
                value = current - '2' + 26;
            } else {
                throw new IllegalArgumentException("Segredo MFA Base32 inválido");
            }
            buffer = (buffer << 5) | value;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                output.write((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }
        return output.toByteArray();
    }
}
