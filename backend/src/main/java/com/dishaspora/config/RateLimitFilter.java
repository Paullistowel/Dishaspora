package com.dishaspora.config;

import com.dishaspora.common.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Lightweight in-memory rate limiter for the sensitive, unauthenticated auth
 * endpoints (login / register / forgot-password / reset-password). It caps
 * attempts per client IP within a fixed time window to blunt brute-force and
 * credential-stuffing, and to slow enumeration-timing probes.
 *
 * <p>Deliberately dependency-free and in-memory: it protects a single instance
 * without Redis/bucket4j. For a horizontally-scaled deployment behind multiple
 * instances, move this state to a shared store — the filter contract stays the
 * same. Buckets are pruned lazily as windows roll over, so memory stays bounded
 * by the number of recently-active IPs.
 *
 * <p>Runs before the JWT filter (high {@code @Order} precedence) so throttling
 * happens before any expensive work. Enabled by default; set
 * {@code RATE_LIMIT_ENABLED=false} to disable (e.g. load tests).
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    /** Paths that are throttled. Prefix-matched against the request URI. */
    private static final String[] LIMITED_PREFIXES = {
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/resend-verification",
    };

    private final boolean enabled;
    private final int maxRequests;
    private final long windowMs;
    private final ObjectMapper objectMapper;

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(ObjectMapper objectMapper,
                           @Value("${rate-limit.enabled:true}") boolean enabled,
                           @Value("${rate-limit.max-requests:10}") int maxRequests,
                           @Value("${rate-limit.window-seconds:60}") long windowSeconds) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.maxRequests = maxRequests;
        this.windowMs = windowSeconds * 1000L;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (enabled && isLimited(request)) {
            String key = clientIp(request) + "|" + request.getRequestURI();
            if (!allow(key)) {
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(windowMs / 1000));
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(
                        ErrorResponse.of(429, "Too many attempts. Please wait a moment and try again.")));
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private boolean isLimited(HttpServletRequest request) {
        String uri = request.getRequestURI();
        for (String prefix : LIMITED_PREFIXES) {
            if (uri.startsWith(prefix)) return true;
        }
        return false;
    }

    /** Fixed-window counter. Returns true if the request is within the allowance. */
    private boolean allow(String key) {
        long now = System.currentTimeMillis();
        Window window = buckets.compute(key, (k, existing) -> {
            if (existing == null || now - existing.start >= windowMs) {
                return new Window(now);
            }
            return existing;
        });
        return window.count.incrementAndGet() <= maxRequests;
    }

    /** Honor X-Forwarded-For (first hop) when behind a proxy/load balancer. */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger(0);
        Window(long start) { this.start = start; }
    }
}
