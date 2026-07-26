package com.dishaspora.ai.controller;

import com.dishaspora.ai.dto.SnapDtos.IngredientListRequest;
import com.dishaspora.ai.dto.SnapDtos.IngredientScanResult;
import com.dishaspora.ai.dto.SnapDtos.SnapResult;
import com.dishaspora.ai.service.SnapService;
import com.dishaspora.auth.entity.User;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Snap &amp; Cook — photograph a dish or ingredients, get an AI-identified recipe
 * with nutrition and matching catalog recipes. Requires authentication (any
 * request under {@code /api/**} not explicitly public must be authenticated).
 */
@RestController
@RequestMapping("/api/snap")
public class SnapController {

    private final SnapService snapService;

    public SnapController(SnapService snapService) {
        this.snapService = snapService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SnapResult analyze(@RequestParam("image") MultipartFile image,
                              @AuthenticationPrincipal User user) {
        return snapService.analyze(image, user);
    }

    /** Photograph your ingredients → detected ingredients + recipe recommendations. */
    @PostMapping(value = "/ingredients", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IngredientScanResult scanIngredients(@RequestParam("image") MultipartFile image,
                                                @AuthenticationPrincipal User user) {
        return snapService.scanIngredients(image, user);
    }

    /** Type-your-ingredients fallback (no photo/AI): ingredient list → recipe recommendations. */
    @PostMapping("/recommend")
    public IngredientScanResult recommend(@RequestBody IngredientListRequest request,
                                          @AuthenticationPrincipal User user) {
        return snapService.recommendFromNames(request.ingredients(), user);
    }
}
