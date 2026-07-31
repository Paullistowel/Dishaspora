package com.dishaspora.notification.dto;

import com.dishaspora.common.enums.Enums.NotificationType;
import com.dishaspora.notification.entity.Notification;

import java.time.Instant;

public final class NotificationDtos {
    private NotificationDtos() {}

    public record NotificationDto(
            Long id,
            NotificationType type,
            String title,
            String body,
            String deepLink,
            String imageUrl,
            boolean read,
            Instant createdAt) {

        public static NotificationDto from(Notification n) {
            return new NotificationDto(
                    n.getId(), n.getType(), n.getTitle(), n.getBody(),
                    n.getDeepLink(), n.getImageUrl(), n.isRead(), n.getCreatedAt());
        }
    }

    public record UnreadCountResponse(long unread) {}
}
