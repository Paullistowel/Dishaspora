package com.dishaspora.auth.service;

import com.dishaspora.auth.dto.AuthDtos.AuthResponse;
import com.dishaspora.auth.dto.AuthDtos.ChangeEmailRequest;
import com.dishaspora.auth.dto.AuthDtos.LoginRequest;
import com.dishaspora.auth.dto.AuthDtos.RegisterRequest;
import com.dishaspora.auth.dto.AuthDtos.UpdateMeRequest;
import com.dishaspora.auth.dto.UserDto;
import com.dishaspora.auth.entity.RefreshToken;
import com.dishaspora.auth.entity.User;
import com.dishaspora.auth.repository.RefreshTokenRepository;
import com.dishaspora.auth.repository.UserRepository;
import com.dishaspora.common.email.EmailService;
import com.dishaspora.common.enums.Enums.NotificationType;
import com.dishaspora.common.enums.Enums.Role;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.notification.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private static final Duration VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration RESET_TTL = Duration.ofHours(1);
    private static final Duration EMAIL_CHANGE_TTL = Duration.ofHours(24);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final String baseUrl;
    private final boolean requireVerifiedEmail;
    private final Duration refreshTtl;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService, EmailService emailService,
                       NotificationService notificationService,
                       @Value("${app.base-url:http://localhost:8080}") String baseUrl,
                       @Value("${auth.require-verified-email:false}") boolean requireVerifiedEmail,
                       @Value("${jwt.refresh-expiration-ms:2592000000}") long refreshExpirationMs) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.requireVerifiedEmail = requireVerifiedEmail;
        this.refreshTtl = Duration.ofMillis(refreshExpirationMs);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setName(request.name());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        user.setCountry(request.country());
        // No auto-generated image — new users get a clean initials avatar until they
        // upload one (avatarUrl stays null; the client renders their initials).
        user.setAvatarUrl(null);
        user.setEmailVerified(false);
        user.setVerificationToken(newToken());
        user.setVerificationTokenExpiry(Instant.now().plus(VERIFICATION_TTL));
        user.setVerificationSentAt(Instant.now());
        user = userRepository.save(user);
        sendVerificationEmail(user);
        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.isDeleted()) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.isBanned()) {
            throw ApiException.forbidden("Your account has been banned. Contact support.");
        }
        if (requireVerifiedEmail && !user.isEmailVerified()) {
            throw ApiException.forbidden("Please verify your email address before signing in. Check your inbox.");
        }
        return issueTokens(user);
    }

    // --- Refresh tokens (Phase 11) ---

    /**
     * Exchange a valid refresh token for a new access token, rotating the refresh
     * token (old one revoked, new one issued) so each token is single-use.
     * Rejects revoked/expired tokens and deleted/banned accounts.
     */
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        RefreshToken existing = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
        if (!existing.isActive()) {
            throw ApiException.unauthorized("Your session has expired. Please sign in again.");
        }
        User user = userRepository.findById(existing.getUserId())
                .orElseThrow(() -> ApiException.unauthorized("Your session has expired. Please sign in again."));
        if (user.isDeleted() || user.isBanned()) {
            existing.setRevoked(true);
            refreshTokenRepository.save(existing);
            throw ApiException.unauthorized("Your session is no longer valid. Please sign in again.");
        }
        // Rotate: revoke the presented token, mint a fresh pair.
        existing.setRevoked(true);
        refreshTokenRepository.save(existing);
        return issueTokens(user);
    }

    /** Revoke a single refresh token (sign-out on this device). Idempotent. */
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    /** Issue an access + refresh token pair for a user and persist the refresh row. */
    private AuthResponse issueTokens(User user) {
        RefreshToken rt = new RefreshToken();
        rt.setToken(newToken());
        rt.setUserId(user.getId());
        rt.setExpiresAt(Instant.now().plus(refreshTtl));
        refreshTokenRepository.save(rt);
        return new AuthResponse(jwtService.generateToken(user), rt.getToken(), UserDto.from(user));
    }

    // --- Email verification (Phase 7) ---

    @Transactional
    public User verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> ApiException.badRequest("This verification link is invalid."));
        if (user.getVerificationTokenExpiry() != null
                && user.getVerificationTokenExpiry().isBefore(Instant.now())) {
            throw ApiException.badRequest("This verification link has expired. Request a new one.");
        }
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);
        return user;
    }

    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (user.isEmailVerified()) return;
            Instant last = user.getVerificationSentAt();
            if (last != null && last.plus(RESEND_COOLDOWN).isAfter(Instant.now())) {
                long wait = RESEND_COOLDOWN.getSeconds() - (Instant.now().getEpochSecond() - last.getEpochSecond());
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Please wait " + Math.max(1, wait) + "s before requesting another email.");
            }
            user.setVerificationToken(newToken());
            user.setVerificationTokenExpiry(Instant.now().plus(VERIFICATION_TTL));
            user.setVerificationSentAt(Instant.now());
            userRepository.save(user);
            sendVerificationEmail(user);
        });
    }

    // --- Password reset (Phase 6) ---

    @Transactional
    public void forgotPassword(String email) {
        // Always behave the same whether or not the email exists (no user enumeration).
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            user.setResetToken(newToken());
            user.setResetTokenExpiry(Instant.now().plus(RESET_TTL));
            userRepository.save(user);
            String link = baseUrl + "/api/auth/reset-password?token=" + user.getResetToken();
            emailService.send(user.getEmail(), "Reset your Dishaspora password", """
                    Hi %s,

                    We received a request to reset your Dishaspora password. Use this token in
                    the app's reset screen, or open the link below (valid for 1 hour):

                    Token: %s
                    %s

                    If you didn't request this, you can safely ignore this email.
                    """.formatted(user.getName(), user.getResetToken(), link));
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> ApiException.badRequest("This reset link is invalid."));
        if (user.getResetTokenExpiry() != null && user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw ApiException.badRequest("This reset link has expired. Request a new one.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    // --- Change email (Phase 8) ---

    @Transactional
    public UserDto requestEmailChange(User current, ChangeEmailRequest request) {
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Your current password is incorrect.");
        }
        String newEmail = request.newEmail().toLowerCase();
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw ApiException.badRequest("That is already your email address.");
        }
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw ApiException.conflict("That email is already in use by another account.");
        }
        user.setPendingEmail(newEmail);
        user.setEmailChangeToken(newToken());
        user.setEmailChangeTokenExpiry(Instant.now().plus(EMAIL_CHANGE_TTL));
        userRepository.save(user);
        String link = baseUrl + "/api/auth/confirm-email-change?token=" + user.getEmailChangeToken();
        emailService.send(newEmail, "Confirm your new Dishaspora email", """
                Hi %s,

                Please confirm this as the new email for your Dishaspora account by opening
                the link below (valid for 24 hours):

                %s

                If you didn't request this change, ignore this email and your address stays the same.
                """.formatted(user.getName(), link));
        return UserDto.from(user);
    }

    @Transactional
    public User confirmEmailChange(String token) {
        User user = userRepository.findByEmailChangeToken(token)
                .orElseThrow(() -> ApiException.badRequest("This confirmation link is invalid."));
        if (user.getEmailChangeTokenExpiry() != null
                && user.getEmailChangeTokenExpiry().isBefore(Instant.now())) {
            // Roll back the pending change on expiry.
            user.setPendingEmail(null);
            user.setEmailChangeToken(null);
            user.setEmailChangeTokenExpiry(null);
            userRepository.save(user);
            throw ApiException.badRequest("This confirmation link has expired. Please request the change again.");
        }
        if (user.getPendingEmail() == null || user.getPendingEmail().isBlank()) {
            throw ApiException.badRequest("There is no pending email change for this account.");
        }
        // Guard against the address being claimed between request and confirm.
        if (userRepository.existsByEmailIgnoreCase(user.getPendingEmail())) {
            user.setPendingEmail(null);
            user.setEmailChangeToken(null);
            user.setEmailChangeTokenExpiry(null);
            userRepository.save(user);
            throw ApiException.conflict("That email is now in use by another account. The change was cancelled.");
        }
        user.setEmail(user.getPendingEmail());
        user.setEmailVerified(true);
        user.setPendingEmail(null);
        user.setEmailChangeToken(null);
        user.setEmailChangeTokenExpiry(null);
        userRepository.save(user);
        return user;
    }

    // --- Change password (logged-in user) ---

    @Transactional
    public void changePassword(User current, String currentPassword, String newPassword) {
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.unauthorized("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw ApiException.badRequest("Your new password must be different from your current one.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        // Any outstanding reset link is now moot.
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        // Changing the password kills every other active session.
        refreshTokenRepository.revokeAllForUser(user.getId());
        notificationService.notify(user.getId(), NotificationType.SECURITY,
                "Password changed",
                "Your Dishaspora password was just changed. If this wasn't you, reset it immediately.",
                "/settings");
    }

    // --- Account deletion (soft-delete) ---

    @Transactional
    public void deleteAccount(User current, String password) {
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("Your password is incorrect.");
        }
        user.setDeleted(true);
        user.setBanned(true);
        // Free the address so the person can register again, and strip PII/tokens.
        user.setEmail("deleted+" + user.getId() + "@dishaspora.invalid");
        user.setName("Deleted user");
        user.setAvatarUrl(null);
        user.setVerificationToken(null);
        user.setResetToken(null);
        user.setEmailChangeToken(null);
        user.setPendingEmail(null);
        userRepository.save(user);
        // Kill all sessions for the deleted account.
        refreshTokenRepository.revokeAllForUser(user.getId());
    }

    // --- Profile update ---

    @Transactional
    public UserDto updateMe(User current, UpdateMeRequest request) {
        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.avatarUrl() != null) {
            // allow clearing the avatar with an empty string
            user.setAvatarUrl(request.avatarUrl().isBlank() ? null : request.avatarUrl());
        }
        if (request.country() != null && !request.country().isBlank()) {
            user.setCountry(request.country());
        }
        return UserDto.from(userRepository.save(user));
    }

    // --- helpers ---

    private void sendVerificationEmail(User user) {
        String link = baseUrl + "/api/auth/verify-email?token=" + user.getVerificationToken();
        emailService.send(user.getEmail(), "Verify your Dishaspora email", """
                Akwaaba %s!

                Welcome to Dishaspora. Please verify your email address by opening the link
                below (valid for 24 hours):

                %s

                Happy cooking!
                """.formatted(user.getName(), link));
    }

    private String newToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }
}
