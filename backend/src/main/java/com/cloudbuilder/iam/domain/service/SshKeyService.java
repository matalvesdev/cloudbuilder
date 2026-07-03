package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.SshKey;
import com.cloudbuilder.iam.domain.port.SshKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;

@Service
@Transactional
public class SshKeyService {

    private final SshKeyRepository sshKeyRepository;

    public SshKeyService(SshKeyRepository sshKeyRepository) {
        this.sshKeyRepository = sshKeyRepository;
    }

    public SshKey addKey(String userId, String tenantId, String name, String publicKey) {
        String fingerprint = calculateFingerprint(publicKey);
        SshKey key = new SshKey(userId, tenantId, name, publicKey.trim(), fingerprint);
        return sshKeyRepository.save(key);
    }

    public List<SshKey> listKeys(String userId) {
        return sshKeyRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void revokeKey(String keyId, String userId) {
        SshKey key = sshKeyRepository.findById(keyId).orElse(null);
        if (key != null && key.getUserId().equals(userId)) {
            key.revoke();
            sshKeyRepository.save(key);
        }
    }

    public void deleteKey(String keyId, String userId) {
        SshKey key = sshKeyRepository.findById(keyId).orElse(null);
        if (key != null && key.getUserId().equals(userId)) {
            sshKeyRepository.deleteById(keyId);
        }
    }

    private String calculateFingerprint(String publicKey) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(publicKey.trim().split("\\s+")[1]);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(keyBytes);
            StringBuilder fp = new StringBuilder("SHA256:");
            for (int i = 0; i < hash.length; i++) {
                fp.append(Base64.getEncoder().encodeToString(new byte[]{hash[i]}).replaceAll("=", ""));
            }
            return fp.toString();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
