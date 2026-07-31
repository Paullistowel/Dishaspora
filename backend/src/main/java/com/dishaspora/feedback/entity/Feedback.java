package com.dishaspora.feedback.entity;

import com.dishaspora.common.enums.Enums.FeedbackStatus;
import com.dishaspora.common.enums.Enums.FeedbackType;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * A user-submitted piece of feedback: a bug report, feature request, general note
 * or star rating. Captures optional device/app metadata (sent automatically by the
 * client) and an optional screenshot to help triage. The {@code status} is managed
 * by the team as they work through submissions.
 */
@Entity
@Table(name = "feedback", indexes = {
        @Index(name = "idx_feedback_user", columnList = "userId"),
        @Index(name = "idx_feedback_status", columnList = "status")
})
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeedbackType type;

    @Column(nullable = false, length = 2000)
    private String message;

    /** 1–5 star rating when type = RATING; null otherwise. */
    private Integer rating;

    @Column(length = 500)
    private String screenshotUrl;

    /** Free-form JSON-ish device string (OS, model, app version) from the client. */
    @Column(length = 500)
    private String deviceInfo;

    @Column(length = 40)
    private String appVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FeedbackStatus status = FeedbackStatus.NEW;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public FeedbackType getType() { return type; }
    public void setType(FeedbackType type) { this.type = type; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getScreenshotUrl() { return screenshotUrl; }
    public void setScreenshotUrl(String screenshotUrl) { this.screenshotUrl = screenshotUrl; }
    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
    public String getAppVersion() { return appVersion; }
    public void setAppVersion(String appVersion) { this.appVersion = appVersion; }
    public FeedbackStatus getStatus() { return status; }
    public void setStatus(FeedbackStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
