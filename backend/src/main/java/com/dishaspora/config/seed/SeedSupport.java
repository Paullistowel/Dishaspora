package com.dishaspora.config.seed;

import com.dishaspora.admin.repository.FlagRepository;
import com.dishaspora.auth.entity.User;
import com.dishaspora.auth.repository.UserRepository;
import com.dishaspora.chat.repository.ChatMessageRepository;
import com.dishaspora.chat.repository.ChatThreadRepository;
import com.dishaspora.common.enums.Enums.ApprovalStatus;
import com.dishaspora.common.enums.Enums.ListingType;
import com.dishaspora.common.enums.Enums.MealType;
import com.dishaspora.common.enums.Enums.RecipeCategory;
import com.dishaspora.common.enums.Enums.Role;
import com.dishaspora.common.enums.Enums.VendorType;
import com.dishaspora.common.util.CountryUtil;
import com.dishaspora.marketplace.entity.Listing;
import com.dishaspora.marketplace.entity.Vendor;
import com.dishaspora.marketplace.repository.ListingRepository;
import com.dishaspora.marketplace.repository.VendorRepository;
import com.dishaspora.order.repository.OrderRepository;
import com.dishaspora.recipe.entity.Ingredient;
import com.dishaspora.recipe.entity.Recipe;
import com.dishaspora.recipe.entity.RecipeStep;
import com.dishaspora.recipe.repository.CookedRecipeRepository;
import com.dishaspora.recipe.repository.RecipeRepository;
import com.dishaspora.recipe.repository.RecipeReviewRepository;
import com.dishaspora.recipe.repository.SavedRecipeRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Shared repositories and builder helpers for the data seeder classes.
 */
@Component
public class SeedSupport {

    public final UserRepository users;
    public final VendorRepository vendors;
    public final RecipeRepository recipes;
    public final ListingRepository listings;
    public final RecipeReviewRepository recipeReviews;
    public final com.dishaspora.marketplace.repository.VendorReviewRepository vendorReviews;
    public final SavedRecipeRepository saved;
    public final CookedRecipeRepository cooked;
    public final OrderRepository orders;
    public final FlagRepository flags;
    public final ChatThreadRepository chatThreads;
    public final ChatMessageRepository chatMessages;
    public final PasswordEncoder encoder;

    public SeedSupport(UserRepository users, VendorRepository vendors, RecipeRepository recipes,
                       ListingRepository listings, RecipeReviewRepository recipeReviews,
                       com.dishaspora.marketplace.repository.VendorReviewRepository vendorReviews,
                       SavedRecipeRepository saved, CookedRecipeRepository cooked,
                       OrderRepository orders, FlagRepository flags,
                       ChatThreadRepository chatThreads, ChatMessageRepository chatMessages,
                       PasswordEncoder encoder) {
        this.users = users;
        this.vendors = vendors;
        this.recipes = recipes;
        this.listings = listings;
        this.recipeReviews = recipeReviews;
        this.vendorReviews = vendorReviews;
        this.saved = saved;
        this.cooked = cooked;
        this.orders = orders;
        this.flags = flags;
        this.chatThreads = chatThreads;
        this.chatMessages = chatMessages;
        this.encoder = encoder;
    }

    // ---- builder helpers ----

    public static Ingredient ing(String name, String quantity, String unit) {
        return new Ingredient(name, quantity, unit);
    }

    public static RecipeStep st(int number, String instruction, int durationMinutes) {
        return new RecipeStep(number, instruction, durationMinutes, null);
    }

    public User user(String name, String email, String rawPassword, Role role, String country,
                     int avatarIdx, boolean premium) {
        User u = new User();
        u.setName(name);
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(rawPassword));
        u.setRole(role);
        u.setCountry(country);
        u.setAvatarUrl("/images/avatar-" + avatarIdx + ".png");
        u.setEmailVerified(true); // seeded demo accounts are pre-verified
        if (premium) {
            u.setPremium(true);
            u.setPremiumUntil(java.time.Instant.now().plus(365, java.time.temporal.ChronoUnit.DAYS));
            u.setPlanCode("PREMIUM_MONTHLY");
        }
        return users.save(u);
    }

    public Vendor vendor(User owner, String name, String bio, String country, VendorType type,
                         int logoIdx, int bannerIdx, String specialty, String location, String phone,
                         double rating, int reviewCount, ApprovalStatus status) {
        Vendor v = new Vendor();
        v.setOwnerUserId(owner.getId());
        v.setName(name);
        v.setBio(bio);
        v.setCountry(country);
        v.setType(type);
        v.setLogoUrl("/images/vendor-" + logoIdx + ".png");
        v.setCoverUrl("/images/banner-" + bannerIdx + ".png");
        v.setSpecialty(specialty);
        v.setLocation(location);
        v.setPhone(phone);
        v.setRating(rating);
        v.setReviewCount(reviewCount);
        v.setStatus(status);
        v = vendors.save(v);
        owner.setVendorId(v.getId());
        users.save(owner);
        return v;
    }

    public Recipe recipe(Vendor vendor, String title, String description, RecipeCategory category,
                         String cuisine, String country, MealType mealType, int imgIdx,
                         int calories, int servings, int prepMinutes, int cookMinutes,
                         String mealFrequency, String mealFrequencyReason,
                         String story, int storyIdx, double rating, int reviewCount,
                         ApprovalStatus status, List<Ingredient> ingredients, List<RecipeStep> steps) {
        Recipe r = new Recipe();
        r.setTitle(title);
        r.setDescription(description);
        r.setCategory(category);
        r.setCuisine(cuisine);
        r.setCountryOfOrigin(country);
        r.setMealType(mealType);
        r.setImageUrl("/images/recipe-" + imgIdx + ".png");
        r.setCalories(calories);
        r.setServings(servings);
        r.setPrepMinutes(prepMinutes);
        r.setCookMinutes(cookMinutes);
        r.setMealFrequency(mealFrequency);
        r.setMealFrequencyReason(mealFrequencyReason);
        r.setStory(story);
        r.setStoryImageUrl("/images/story-" + (1 + ((storyIdx - 1) % 8)) + ".png");
        r.setVendorId(vendor.getId());
        r.setStatus(status);
        r.setRating(rating);
        r.setReviewCount(reviewCount);
        r.getIngredients().addAll(ingredients);
        r.getSteps().addAll(steps);
        return recipes.save(r);
    }

    /**
     * Variant of {@link #recipe} for dishes whose photography lives on an external
     * host rather than the bundled /images/recipe-N.png set. Also carries an explicit
     * "watch the preparation" link.
     */
    public Recipe recipeWithMedia(Vendor vendor, String title, String description, RecipeCategory category,
                                  String cuisine, String country, MealType mealType, String imageUrl,
                                  int calories, int servings, int prepMinutes, int cookMinutes,
                                  String mealFrequency, String mealFrequencyReason,
                                  String story, int storyIdx, String videoSearchUrl,
                                  double rating, int reviewCount, ApprovalStatus status,
                                  List<Ingredient> ingredients, List<RecipeStep> steps) {
        Recipe r = new Recipe();
        r.setTitle(title);
        r.setDescription(description);
        r.setCategory(category);
        r.setCuisine(cuisine);
        r.setCountryOfOrigin(country);
        r.setMealType(mealType);
        r.setImageUrl(imageUrl);
        r.setCalories(calories);
        r.setServings(servings);
        r.setPrepMinutes(prepMinutes);
        r.setCookMinutes(cookMinutes);
        r.setMealFrequency(mealFrequency);
        r.setMealFrequencyReason(mealFrequencyReason);
        r.setStory(story);
        r.setStoryImageUrl("/images/story-" + (1 + ((storyIdx - 1) % 8)) + ".png");
        r.setVideoSearchUrl(videoSearchUrl);
        r.setVendorId(vendor.getId());
        r.setStatus(status);
        r.setRating(rating);
        r.setReviewCount(reviewCount);
        r.getIngredients().addAll(ingredients);
        r.getSteps().addAll(steps);
        return recipes.save(r);
    }

    public Listing listing(Vendor vendor, ListingType type, String title, String description, int imgIdx,
                           long amountMinor, Long compareAtMinor, int stockQty, String quantity, String unit,
                           Integer prepMinutes, Long linkedRecipeId, ApprovalStatus status) {
        Listing l = new Listing();
        l.setType(type);
        l.setTitle(title);
        l.setDescription(description);
        l.setImageUrl("/images/listing-" + imgIdx + ".png");
        l.setAmountMinor(amountMinor);
        l.setCompareAtMinor(compareAtMinor);
        l.setCountry(vendor.getCountry());
        l.setCurrency(CountryUtil.currencyFor(vendor.getCountry()));
        l.setAvailable(true);
        l.setStockQty(stockQty);
        l.setQuantity(quantity);
        l.setUnit(unit);
        l.setPrepMinutes(prepMinutes);
        l.setVendorId(vendor.getId());
        l.setLinkedRecipeId(linkedRecipeId);
        l.setStatus(status);
        return listings.save(l);
    }

    public Long recipeIdByTitle(String title) {
        return recipes.findAll().stream()
                .filter(r -> r.getTitle().equalsIgnoreCase(title))
                .map(Recipe::getId)
                .findFirst()
                .orElse(null);
    }
}
