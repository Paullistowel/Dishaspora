package com.dishaspora.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Enables method-level caching (used by {@link com.dishaspora.meal.service.MealDbClient}).
 * TheMealDB data is effectively static, so an in-memory cache avoids hammering the
 * upstream API and keeps search/lookup snappy. Simple ConcurrentMap cache — no
 * external cache server needed.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                "mealdb-search",
                "mealdb-lookup",
                "mealdb-categories",
                "mealdb-areas",
                "mealdb-ingredients",
                "mealdb-filter");
    }
}
