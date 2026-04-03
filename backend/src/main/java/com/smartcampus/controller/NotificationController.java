package com.smartcampus.controller;

import com.smartcampus.dto.request.NotificationPreferenceRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<NotificationResponse> notifications =
                notificationService.getUserNotifications(principal.getUser().getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved successfully", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAsRead(id, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(id, principal.getUser().getId());
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Notification deleted successfully", null));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationPreference prefs = notificationService.getPreferences(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved successfully", prefs));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody NotificationPreferenceRequest request) {
        NotificationPreference prefs = notificationService.updatePreferences(
                principal.getUser().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully", prefs));
    }
}
