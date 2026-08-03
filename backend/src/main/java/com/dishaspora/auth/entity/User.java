package com.dishaspora.auth.entity;

import com.dishaspora.common.enums.Enums.Role;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    @Column(nullable = false)
    private String country = "GH";

    private String avatarUrl;

    private boolean premium;

    private Instant premiumUntil;

    private String planCode;

    /** Denormalized: id of the vendor profile owned by this user, if any. */
    private Long vendorId;

    private boolean banned;

    /** Soft-delete: the row is kept for order history but the account can no longer sign in. */
    private boolean deleted;

    /** Email verification (Phase 7). */
    private boolean emailVerified;
    private String verificationToken;
    private Instant verificationTokenExpiry;
    private Instant verificationSentAt;

    /** Password reset (Phase 6). */
    private String resetToken;
    private Instant resetTokenExpiry;

    /** Change-email (Phase 8): the new address stays pending until confirmed. */
    private String pendingEmail;
    private String emailChangeToken;
    private Instant emailChangeTokenExpiry;

    /** Nutrition goals (Phase 5). Sensible defaults; editable by the user. */
    private int calorieGoal = 2000;
    private int proteinGoal = 120;
    private int carbGoal = 250;
    private int fatGoal = 70;
    private int waterGoalMl = 2000;

    /**
     * Dietary preferences for AI personalization + allergen warnings. Stored as
     * comma-separated values to avoid join tables (small, user-scoped lists).
     * allergies: e.g. "peanuts,shellfish"; dietaryPreferences: e.g. "vegetarian,halal";
     * fitnessGoal: single value e.g. "lose_weight" | "build_muscle" | "maintain".
     */
    @Column(length = 500)
    private String allergies = "";
    @Column(length = 500)
    private String dietaryPreferences = "";
    @Column(length = 40)
    private String fitnessGoal = "";

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public boolean isPremiumActive() {
        return premium && (premiumUntil == null || premiumUntil.isAfter(Instant.now()));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public boolean isPremium() { return premium; }
    public void setPremium(boolean premium) { this.premium = premium; }
    public Instant getPremiumUntil() { return premiumUntil; }
    public void setPremiumUntil(Instant premiumUntil) { this.premiumUntil = premiumUntil; }
    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public boolean isBanned() { return banned; }
    public void setBanned(boolean banned) { this.banned = banned; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public Instant getVerificationTokenExpiry() { return verificationTokenExpiry; }
    public void setVerificationTokenExpiry(Instant v) { this.verificationTokenExpiry = v; }
    public Instant getVerificationSentAt() { return verificationSentAt; }
    public void setVerificationSentAt(Instant verificationSentAt) { this.verificationSentAt = verificationSentAt; }
    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }
    public Instant getResetTokenExpiry() { return resetTokenExpiry; }
    public void setResetTokenExpiry(Instant resetTokenExpiry) { this.resetTokenExpiry = resetTokenExpiry; }
    public String getPendingEmail() { return pendingEmail; }
    public void setPendingEmail(String pendingEmail) { this.pendingEmail = pendingEmail; }
    public String getEmailChangeToken() { return emailChangeToken; }
    public void setEmailChangeToken(String emailChangeToken) { this.emailChangeToken = emailChangeToken; }
    public Instant getEmailChangeTokenExpiry() { return emailChangeTokenExpiry; }
    public void setEmailChangeTokenExpiry(Instant e) { this.emailChangeTokenExpiry = e; }
    public int getCalorieGoal() { return calorieGoal; }
    public void setCalorieGoal(int calorieGoal) { this.calorieGoal = calorieGoal; }
    public int getProteinGoal() { return proteinGoal; }
    public void setProteinGoal(int proteinGoal) { this.proteinGoal = proteinGoal; }
    public int getCarbGoal() { return carbGoal; }
    public void setCarbGoal(int carbGoal) { this.carbGoal = carbGoal; }
    public int getFatGoal() { return fatGoal; }
    public void setFatGoal(int fatGoal) { this.fatGoal = fatGoal; }
    public int getWaterGoalMl() { return waterGoalMl; }
    public void setWaterGoalMl(int waterGoalMl) { this.waterGoalMl = waterGoalMl; }
    public String getAllergies() { return allergies == null ? "" : allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public String getDietaryPreferences() { return dietaryPreferences == null ? "" : dietaryPreferences; }
    public void setDietaryPreferences(String dietaryPreferences) { this.dietaryPreferences = dietaryPreferences; }
    public String getFitnessGoal() { return fitnessGoal == null ? "" : fitnessGoal; }
    public void setFitnessGoal(String fitnessGoal) { this.fitnessGoal = fitnessGoal; }
    /** Allergies as a lowercase list (empty if none set). */
    public java.util.List<String> allergyList() {
        String a = getAllergies().trim();
        if (a.isEmpty()) return java.util.List.of();
        return java.util.Arrays.stream(a.split(","))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .toList();
    }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
