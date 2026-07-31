package com.dishaspora.notification.service;

import com.dishaspora.common.enums.Enums.NotificationType;
import com.dishaspora.common.exception.ApiException;
import com.dishaspora.notification.dto.NotificationDtos.NotificationDto;
import com.dishaspora.notification.entity.Notification;
import com.dishaspora.notification.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates and serves in-app notifications. Other modules call
 * {@link #notify} (or the convenience overload) to push a notification to a user;
 * the mobile app reads them via the controller and shows an unread badge.
 *
 * <p>Creation is best-effort and isolated: a failure to write a notification must
 * never break the business action that triggered it (an order still succeeds even
 * if its notification insert fails), so {@code notify} swallows and logs errors.
 */
@Service
public class NotificationService {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    /** Create a notification for a user. Best-effort — never throws to the caller. */
    @Transactional
    public void notify(Long userId, NotificationType type, String title, String body,
                       String deepLink, String imageUrl) {
        try {
            Notification n = new Notification();
            n.setUserId(userId);
            n.setType(type);
            n.setTitle(truncate(title, 120));
            n.setBody(truncate(body, 500));
            n.setDeepLink(deepLink);
            n.setImageUrl(imageUrl);
            repository.save(n);
        } catch (Exception e) {
            log.warn("Failed to create notification for user {}: {}", userId, e.getMessage());
        }
    }

    /** Convenience overload without media. */
    public void notify(Long userId, NotificationType type, String title, String body, String deepLink) {
        notify(userId, type, title, body, deepLink, null);
    }

    public Page<NotificationDto> list(Long userId, int page, int size) {
        return repository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(Math.max(0, page), clampSize(size)))
                .map(NotificationDto::from);
    }

    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long userId, Long id) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        if (!n.isRead()) {
            n.setRead(true);
            repository.save(n);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        repository.markAllReadForUser(userId);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));
        repository.delete(n);
    }

    private static int clampSize(int size) {
        if (size < 1) return 20;
        return Math.min(size, 50);
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }
}
