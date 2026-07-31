package com.dishaspora.common.enums;

public final class Enums {
    private Enums() {}

    public enum Role { USER, VENDOR, ADMIN }

    public enum ApprovalStatus { PENDING, APPROVED, REJECTED }

    public enum RecipeCategory { LOCAL, CONTINENTAL, FOREIGN, DRINK }

    public enum MealType { BREAKFAST, LUNCH, DINNER, SNACK, DRINK }

    public enum VendorType { FOOD, INGREDIENT, BOTH }

    public enum ListingType { FOOD, INGREDIENT }

    public enum OrderStatus { PENDING_PAYMENT, PAID, PREPARING, READY, COMPLETED, CANCELLED }

    public enum FlagType { DUPLICATE_RECIPE, COUNTRY_MISMATCH, CATEGORY_SUSPECT, INAPPROPRIATE, REPEATED_SUBMISSION }

    public enum FlagTargetType { RECIPE, LISTING, VENDOR }

    public enum SubscriptionStatus { PENDING, ACTIVE }

    /** In-app notification categories (Phase 5). */
    public enum NotificationType {
        MEAL_UPDATE, ORDER_UPDATE, RECOMMENDATION, SECURITY, ANNOUNCEMENT, PROMOTION
    }

    /** User feedback categories (Phase 8). */
    public enum FeedbackType { BUG, FEATURE, GENERAL, RATING }

    /** Lifecycle of a feedback submission as triaged by the team. */
    public enum FeedbackStatus { NEW, IN_REVIEW, RESOLVED }
}
