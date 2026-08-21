package com.cloudbuilder.iam.infrastructure.email;

import com.cloudbuilder.iam.domain.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Real email service that sends invitation and password reset emails via SMTP.
 * Falls back to logging if mail sender is not configured.
 */
@Component
public class InvitationEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(InvitationEmailService.class);

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;

    @Value("${cloudbuilder.mail.from-address:noreply@cloudbuilder.dev}")
    private String fromAddress;

    @Value("${cloudbuilder.mail.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public InvitationEmailService(
            @Nullable @Autowired(required = false) JavaMailSender mailSender,
            @Value("${cloudbuilder.mail.enabled:false}") boolean mailEnabled) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
    }

    @Override
    public void sendInvitationEmail(String email, String token, String organizationId) {
        String acceptUrl = frontendUrl + "/?authMode=invite&token=" + token;

        if (!mailEnabled || mailSender == null) {
            log.info("═══════════════════════════════════════════════════════════");
            log.info("  📧 INVITATION EMAIL (mail disabled — console only)");
            log.info("═══════════════════════════════════════════════════════════");
            log.info("  To:      {}", email);
            log.info("  Org:     {}", organizationId);
            log.info("  Token:   {}", token);
            log.info("  Accept:  {}", acceptUrl);
            log.info("═══════════════════════════════════════════════════════════");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(email);
            helper.setSubject("Você foi convidado para o CloudBuilder");

            String htmlBody = buildInvitationHtml(acceptUrl, organizationId, token);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Invitation email sent to {} for org {}", email, organizationId);
        } catch (MessagingException e) {
            log.error("Failed to send invitation email to {}: {}", email, e.getMessage());
            // Don't throw — invitation is already created, email is best-effort
        }
    }

    @Override
    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = frontendUrl + "/?authMode=reset-password&token=" + token;

        if (!mailEnabled || mailSender == null) {
            log.info("═══════════════════════════════════════════════════════════");
            log.info("  🔑 PASSWORD RESET EMAIL (mail disabled — console only)");
            log.info("═══════════════════════════════════════════════════════════");
            log.info("  To:      {}", email);
            log.info("  Token:   {}", token);
            log.info("  Reset:   {}", resetUrl);
            log.info("═══════════════════════════════════════════════════════════");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(email);
            helper.setSubject("Redefina sua senha — CloudBuilder");

            String htmlBody = buildPasswordResetHtml(resetUrl);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Password reset email sent to {}", email);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", email, e.getMessage());
        }
    }

    private String buildInvitationHtml(String acceptUrl, String orgId, String token) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background:linear-gradient(135deg,#0D1B2A 0%,#1B2838 100%);padding:40px 40px 30px;text-align:center;">
                          <div style="width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.1);display:inline-block;line-height:56px;font-size:28px;">☁️</div>
                          <h1 style="color:#ffffff;font-size:22px;margin:16px 0 8px;font-weight:700;">CloudBuilder</h1>
                          <p style="color:#94a3b8;font-size:14px;margin:0;">Platform Engineering Platform</p>
                        </td>
                      </tr>
                      <!-- Body -->
                      <tr>
                        <td style="padding:36px 40px;">
                          <h2 style="color:#0D1B2A;font-size:18px;margin:0 0 12px;">Você foi convidado! 🎉</h2>
                          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                            Você foi convidado para participar da organização <strong style="color:#0D1B2A;">%s</strong> no CloudBuilder.
                            Clique no botão abaixo para criar sua conta e começar a testar.
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding:0 0 24px;">
                                <a href="%s" style="display:inline-block;padding:14px 32px;background-color:#0D1B2A;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.5px;">
                                  Aceitar Convite →
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;">
                            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                            <a href="%s" style="color:#0D1B2A;word-break:break-all;">%s</a>
                          </p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
                          <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
                            Este convite expira em 7 dias. Se você não solicitou este convite, ignore este email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(orgId, acceptUrl, acceptUrl, acceptUrl);
    }

    private String buildPasswordResetHtml(String resetUrl) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
                <tr>
                  <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background:linear-gradient(135deg,#0D1B2A 0%,#1B2838 100%);padding:40px 40px 30px;text-align:center;">
                          <div style="width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.1);display:inline-block;line-height:56px;font-size:28px;">🔑</div>
                          <h1 style="color:#ffffff;font-size:22px;margin:16px 0 8px;font-weight:700;">CloudBuilder</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:36px 40px;">
                          <h2 style="color:#0D1B2A;font-size:18px;margin:0 0 12px;">Redefinir senha</h2>
                          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                            Clique no botão abaixo para redefinir sua senha. Este link expira em 1 hora.
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="padding:0 0 24px;">
                                <a href="%s" style="display:inline-block;padding:14px 32px;background-color:#0D1B2A;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;">
                                  Redefinir Senha →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
                          <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
                            Se você não solicitou a redefinição de senha, ignore este email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(resetUrl);
    }
}
