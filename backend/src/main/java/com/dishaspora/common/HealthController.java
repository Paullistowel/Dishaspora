package com.dishaspora.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight liveness endpoint for platform health checks (e.g. Railway).
 * Public and dependency-free so the container is marked healthy as soon as the
 * web layer is up.
 */
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "dishaspora-backend");
    }
}
