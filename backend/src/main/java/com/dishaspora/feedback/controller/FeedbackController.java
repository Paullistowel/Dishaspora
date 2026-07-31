package com.dishaspora.feedback.controller;

import com.dishaspora.auth.entity.User;
import com.dishaspora.feedback.dto.FeedbackDtos.CreateFeedbackRequest;
import com.dishaspora.feedback.dto.FeedbackDtos.FeedbackDto;
import com.dishaspora.feedback.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public FeedbackDto submit(@AuthenticationPrincipal User user,
                              @Valid @RequestBody CreateFeedbackRequest request) {
        return feedbackService.submit(user.getId(), request);
    }

    @GetMapping("/mine")
    public List<FeedbackDto> mine(@AuthenticationPrincipal User user) {
        return feedbackService.listMine(user.getId());
    }
}
