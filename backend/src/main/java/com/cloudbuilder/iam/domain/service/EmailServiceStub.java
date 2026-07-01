package com.cloudbuilder.iam.domain.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailServiceStub implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceStub.class);

    @Override
    public void sendInvitationEmail(String email, String token, String organizationId) {
        log.info("[EMAIL STUB] Sending invitation email to: {} | token: {} | org: {}", email, token, organizationId);
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        log.info("[EMAIL STUB] Sending password reset email to: {} | token: {}", email, token);
    }
}
