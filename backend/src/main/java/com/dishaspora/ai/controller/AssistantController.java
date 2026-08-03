package com.dishaspora.ai.controller;

import com.dishaspora.ai.dto.AiDtos.AssistantChatRequest;
import com.dishaspora.ai.dto.AiDtos.AssistantReply;
import com.dishaspora.ai.dto.AiDtos.MealSuggestions;
import com.dishaspora.ai.dto.AiDtos.SmartSearchResponse;
import com.dishaspora.ai.service.AssistantService;
import com.dishaspora.auth.entity.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/assistant/chat")
    public AssistantReply chat(@Valid @RequestBody AssistantChatRequest request,
                               @AuthenticationPrincipal User user) {
        return assistantService.chat(request, user);
    }

    @GetMapping("/search/smart")
    public SmartSearchResponse smartSearch(@RequestParam(required = false, defaultValue = "") String q,
                                           @AuthenticationPrincipal User user) {
        return assistantService.smartSearch(q, user);
    }

    /** Personalized breakfast/lunch/dinner suggestions (free — no premium gate). */
    @GetMapping("/assistant/recommendations")
    public MealSuggestions recommendations(@AuthenticationPrincipal User user) {
        return assistantService.recommendMeals(user);
    }
}
