package com.smartcampus.service.impl;

import com.smartcampus.dto.request.NotificationPreferenceRequest;
import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.Notification;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.entity.enums.NotificationType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.NotificationPreferenceRepository;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository notificationPreferenceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MongoTemplate mongoTemplate;

    @Override
    public void sendNotification(String userId, NotificationType type, String title,
                                 String message, String referenceType, String referenceId) {
        // Check user preferences before sending
        if (!isNotificationEnabled(userId, type)) {
            log.debug("Notification type {} disabled for user {}, skipping", type, userId);
            return;
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();

        Notification saved = notificationRepository.save(notification);

        NotificationResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSendToUser(
                userId, "/queue/notifications", response);

        log.debug("Notification sent to user {}: {}", userId, title);
    }

    @Override
    public PagedResponse<NotificationResponse> getUserNotifications(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return PagedResponse.<NotificationResponse>builder()
                .content(notificationPage.getContent().stream()
                        .map(this::mapToResponse)
                        .toList())
                .page(notificationPage.getNumber())
                .size(notificationPage.getSize())
                .totalElements(notificationPage.getTotalElements())
                .totalPages(notificationPage.getTotalPages())
                .last(notificationPage.isLast())
                .build();
    }

    @Override
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to modify this notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(String userId) {
        Query query = Query.query(Criteria.where("userId").is(userId).and("isRead").is(false));
        Update update = new Update().set("isRead", true);
        mongoTemplate.updateMulti(query, update, Notification.class);
    }

    @Override
    public void deleteNotification(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to delete this notification");
        }

        notificationRepository.delete(notification);
    }

    @Override
    public NotificationPreference getPreferences(String userId) {
        return notificationPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreference defaultPrefs = NotificationPreference.builder()
                            .userId(userId)
                            .bookingUpdates(true)
                            .ticketUpdates(true)
                            .commentNotifications(true)
                            .systemNotifications(true)
                            .build();
                    return notificationPreferenceRepository.save(defaultPrefs);
                });
    }

    @Override
    public NotificationPreference updatePreferences(String userId, NotificationPreferenceRequest request) {
        NotificationPreference prefs = getPreferences(userId);

        if (request.getBookingUpdates() != null) {
            prefs.setBookingUpdates(request.getBookingUpdates());
        }
        if (request.getTicketUpdates() != null) {
            prefs.setTicketUpdates(request.getTicketUpdates());
        }
        if (request.getCommentNotifications() != null) {
            prefs.setCommentNotifications(request.getCommentNotifications());
        }
        if (request.getSystemNotifications() != null) {
            prefs.setSystemNotifications(request.getSystemNotifications());
        }

        return notificationPreferenceRepository.save(prefs);
    }

    private boolean isNotificationEnabled(String userId, NotificationType type) {
        NotificationPreference prefs = notificationPreferenceRepository.findByUserId(userId)
                .orElse(null);

        // If no preferences exist, all notifications are enabled by default
        if (prefs == null) {
            return true;
        }

        return switch (type) {
            case BOOKING_APPROVED, BOOKING_REJECTED -> Boolean.TRUE.equals(prefs.getBookingUpdates());
            case TICKET_STATUS_CHANGED, TICKET_ASSIGNED -> Boolean.TRUE.equals(prefs.getTicketUpdates());
            case NEW_COMMENT -> Boolean.TRUE.equals(prefs.getCommentNotifications());
            case SYSTEM -> Boolean.TRUE.equals(prefs.getSystemNotifications());
        };
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .referenceType(notification.getReferenceType())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
