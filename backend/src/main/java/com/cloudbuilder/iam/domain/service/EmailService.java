package com.cloudbuilder.iam.domain.service;

public interface EmailService {
    void sendInvitationEmail(String email, String token, String organizationId);
    void sendPasswordResetEmail(String email, String token);
}
