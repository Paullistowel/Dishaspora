package com.dishaspora.common.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification, password reset, email-change).
 *
 * <p>If SMTP is configured ({@code spring.mail.host} set → Spring Boot auto-creates
 * a {@link JavaMailSender} bean) it sends real multipart (HTML + plain-text) mail.
 * Otherwise it logs the message so the auth flows stay testable locally without an
 * SMTP server. Delivery failures are logged with the full stack trace and never
 * bubble up to fail the caller's request.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail.from:Dishaspora <no-reply@dishaspora.app>}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    /** True when a real SMTP transport is wired (spring.mail.host set). */
    public boolean isConfigured() {
        return mailSender.getIfAvailable() != null;
    }

    /**
     * Send a transactional email. {@code body} is plain text; it is also wrapped
     * in a minimal branded HTML template as the multipart HTML alternative.
     *
     * @return true if handed to the SMTP transport successfully, false if SMTP is
     *         unconfigured (logged only) or delivery failed.
     */
    public boolean send(String to, String subject, String body) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("""
                    [EMAIL — SMTP NOT CONFIGURED, logging only. Set SPRING_MAIL_HOST/USERNAME/PASSWORD to deliver.]
                    To: {}
                    Subject: {}
                    {}""", to, subject, body);
            return false;
        }
        log.info("Email: preparing '{}' -> {} (SMTP transport active)", subject, to);
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, htmlTemplate(body)); // (plainText, html)
            log.debug("Email: opening SMTP connection for '{}' -> {}", subject, to);
            sender.send(message);
            log.info("Email: DELIVERED '{}' -> {}", subject, to);
            return true;
        } catch (MailException | jakarta.mail.MessagingException e) {
            // Never fail the request because email delivery failed — surface the
            // full cause for ops. Callers still succeed; the user can "resend".
            log.error("Email: FAILED to send '{}' -> {}: {}", subject, to, e.getMessage(), e);
            return false;
        }
    }

    /** Minimal branded HTML wrapper. Bare http(s) links are auto-linked. */
    private String htmlTemplate(String body) {
        String escaped = body
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
        String withLinks = escaped.replaceAll(
                "(https?://\\S+)", "<a href=\"$1\" style=\"color:#0FB8C4\">$1</a>");
        String html = withLinks.replace("\n", "<br>");
        return """
                <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#17252A">
                  <div style="font-size:20px;font-weight:800;color:#0FB8C4;margin-bottom:16px">Dishaspora</div>
                  <div style="font-size:15px;line-height:1.6">%s</div>
                  <hr style="border:none;border-top:1px solid #EFF3F5;margin:24px 0">
                  <div style="font-size:12px;color:#9AA7AE">You received this because someone used this address to sign up for Dishaspora. If that wasn't you, you can ignore this email.</div>
                </div>
                """.formatted(html);
    }
}
