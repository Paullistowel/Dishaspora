package com.dishaspora.notification.controller;

import com.dishaspora.auth.dto.AuthDtos.MessageResponse;
import com.dishaspora.auth.entity.User;
import com.dishaspora.notification.dto.NotificationDtos.NotificationDto;
import com.dishaspora.notification.dto.NotificationDtos.UnreadCountResponse;
import com.dishaspora.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Page<NotificationDto> list(@AuthenticationPrincipal User user,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        return notificationService.list(user.getId(), page, size);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal User user) {
        return new UnreadCountResponse(notificationService.unreadCount(user.getId()));
    }

    @PostMapping("/{id}/read")
    public MessageResponse markRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markRead(user.getId(), id);
        return new MessageResponse("Marked as read.");
    }

    @PostMapping("/read-all")
    public MessageResponse markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user.getId());
        return new MessageResponse("All notifications marked as read.");
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.delete(user.getId(), id);
        return new MessageResponse("Notification deleted.");
    }
}
