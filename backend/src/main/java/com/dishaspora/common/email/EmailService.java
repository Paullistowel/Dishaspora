package com.dishaspora.common.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification, password reset, email-change).
 * If SMTP is configured ({@code spring.mail.host} set → a JavaMailSender bean
 * exists) it sends real mail; otherwise it logs the message so the auth flows
 * remain fully testable locally without an SMTP server.
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

    public void send(String to, String subject, String body) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("""
                    [EMAIL — SMTP not configured, logging only]
                    To: {}
                    Subject: {}
                    {}""", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
            log.info("Sent email '{}' to {}", subject, to);
        } catch (Exception e) {
            // Never fail the request because email delivery failed; log for ops.
            log.error("Failed to send email '{}' to {}: {}", subject, to, e.getMessage());
        }
    }
}
