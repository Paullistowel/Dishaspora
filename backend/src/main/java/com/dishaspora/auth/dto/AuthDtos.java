package com.dishaspora.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class AuthDtos {
    private AuthDtos() {}

    /** At least 8 chars, with an uppercase, a lowercase and a digit. */
    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,100}$";
    public static final String PASSWORD_MESSAGE =
            "Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number";

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password,
            @NotBlank @Pattern(regexp = "GH|NG", message = "must be GH or NG") String country) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record AuthResponse(String token, String refreshToken, UserDto user) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(@NotBlank String refreshToken) {}

    public record UpdateMeRequest(String name, String avatarUrl,
            @Pattern(regexp = "GH|NG", message = "must be GH or NG") String country) {}

    /** Dietary preferences for AI personalization. Comma-separated allergies /
     * dietary tags; fitnessGoal is a single value. All optional. */
    public record UpdatePreferencesRequest(
            @jakarta.validation.constraints.Size(max = 500) String allergies,
            @jakarta.validation.constraints.Size(max = 500) String dietaryPreferences,
            @jakarta.validation.constraints.Size(max = 40) String fitnessGoal) {}

    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String password) {}

    public record ResendVerificationRequest(@NotBlank @Email String email) {}

    public record ChangeEmailRequest(
            @NotBlank @Email String newEmail,
            @NotBlank String password) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MESSAGE) String newPassword) {}

    public record DeleteAccountRequest(@NotBlank String password) {}

    /** Generic OK payload for flows that shouldn't leak whether an email exists. */
    public record MessageResponse(String message) {}
}
