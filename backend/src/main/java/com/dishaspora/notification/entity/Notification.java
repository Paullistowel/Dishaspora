package com.dishaspora.notification.entity;

import com.dishaspora.common.enums.Enums.NotificationType;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * A single in-app notification for one user. Notifications are created by other
 * modules via NotificationService (order status changes, security events,
 * recommendations, announcements). {@code deepLink} is an optional app route the
 * client navigates to when the row is tapped (e.g. "/orders" or "/recipe/42").
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_user", columnList = "userId"),
        @Index(name = "idx_notif_user_read", columnList = "userId,read")
})
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NotificationType type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    /** Optional in-app route to open on tap. */
    @Column(length = 200)
    private String deepLink;

    /** Optional image/icon url for richer rows. */
    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private boolean read = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public String getDeepLink() { return deepLink; }
    public void setDeepLink(String deepLink) { this.deepLink = deepLink; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
