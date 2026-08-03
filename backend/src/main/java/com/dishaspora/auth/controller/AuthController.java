package com.dishaspora.auth.controller;

import com.dishaspora.auth.dto.AuthDtos.AuthResponse;
import com.dishaspora.auth.dto.AuthDtos.ForgotPasswordRequest;
import com.dishaspora.auth.dto.AuthDtos.LoginRequest;
import com.dishaspora.auth.dto.AuthDtos.LogoutRequest;
import com.dishaspora.auth.dto.AuthDtos.MessageResponse;
import com.dishaspora.auth.dto.AuthDtos.RefreshRequest;
import com.dishaspora.auth.dto.AuthDtos.RegisterRequest;
import com.dishaspora.auth.dto.AuthDtos.ResendVerificationRequest;
import com.dishaspora.auth.dto.AuthDtos.ResetPasswordRequest;
import com.dishaspora.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Response token is non-null (auto sign-in) when SMTP is not configured, or
        // null (verify-your-email) when it is. The client branches on that.
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Exchange a refresh token for a fresh access + refresh pair (token rotation). */
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    /** Revoke the given refresh token (sign-out on this device). */
    @PostMapping("/logout")
    public MessageResponse logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return new MessageResponse("Signed out.");
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return new MessageResponse(
                "If an account exists for that email, we've sent password reset instructions.");
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
        return new MessageResponse("Your password has been reset. You can now sign in.");
    }

    @PostMapping("/resend-verification")
    public MessageResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request.email());
        return new MessageResponse("If your email needs verification, we've sent a fresh link.");
    }

    @GetMapping(value = "/verify-email", produces = MediaType.TEXT_HTML_VALUE)
    public String verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return page("Email verified ✓",
                "Your email is confirmed. You can head back to the Dishaspora app and sign in.");
    }

    @GetMapping(value = "/confirm-email-change", produces = MediaType.TEXT_HTML_VALUE)
    public String confirmEmailChange(@RequestParam String token) {
        var user = authService.confirmEmailChange(token);
        return page("Email updated ✓",
                "Your Dishaspora email is now " + user.getEmail() + ". You can close this tab.");
    }

    /** Minimal self-contained confirmation page shown when an email link is opened in a browser. */
    private String page(String title, String body) {
        return """
                <!doctype html><html lang="en"><head><meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Dishaspora</title></head>
                <body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#FDF5EA;
                display:flex;min-height:100vh;align-items:center;justify-content:center">
                <div style="background:#fff;border-radius:20px;padding:40px 32px;max-width:400px;text-align:center;
                box-shadow:0 8px 30px rgba(0,0,0,.08)">
                <div style="font-size:22px;font-weight:800;color:#F27F0C;margin-bottom:8px">dishaspora</div>
                <h1 style="font-size:20px;color:#17252A;margin:12px 0">%s</h1>
                <p style="color:#5C6B73;font-size:14px;line-height:1.5">%s</p>
                </div></body></html>""".formatted(title, body);
    }
}
