package com.dishaspora.feedback.dto;

import com.dishaspora.common.enums.Enums.FeedbackStatus;
import com.dishaspora.common.enums.Enums.FeedbackType;
import com.dishaspora.feedback.entity.Feedback;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class FeedbackDtos {
    private FeedbackDtos() {}

    public record CreateFeedbackRequest(
            @NotNull FeedbackType type,
            @NotBlank @Size(max = 2000) String message,
            @Min(1) @Max(5) Integer rating,
            @Size(max = 500) String screenshotUrl,
            @Size(max = 500) String deviceInfo,
            @Size(max = 40) String appVersion) {}

    public record FeedbackDto(
            Long id,
            FeedbackType type,
            String message,
            Integer rating,
            String screenshotUrl,
            FeedbackStatus status,
            Instant createdAt) {

        public static FeedbackDto from(Feedback f) {
            return new FeedbackDto(f.getId(), f.getType(), f.getMessage(), f.getRating(),
                    f.getScreenshotUrl(), f.getStatus(), f.getCreatedAt());
        }
    }
}
