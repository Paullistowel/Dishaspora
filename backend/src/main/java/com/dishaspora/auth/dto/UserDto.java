package com.dishaspora.auth.dto;

import com.dishaspora.auth.entity.User;

public record UserDto(Long id, String name, String email, String role, String country,
                      String avatarUrl, boolean premium, String premiumUntil, Long vendorId,
                      boolean emailVerified, String pendingEmail,
                      String allergies, String dietaryPreferences, String fitnessGoal) {

    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getCountry(),
                user.getAvatarUrl(),
                user.isPremiumActive(),
                user.getPremiumUntil() == null ? null : user.getPremiumUntil().toString(),
                user.getVendorId(),
                user.isEmailVerified(),
                user.getPendingEmail(),
                user.getAllergies(),
                user.getDietaryPreferences(),
                user.getFitnessGoal());
    }
}
