package com.smartcampus.service;

import com.smartcampus.dto.request.NotificationPreferenceRequest;
import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.NotificationPreference;
import com.smartcampus.entity.enums.NotificationType;

public interface NotificationService {

    void sendNotification(String userId, NotificationType type, String title,
                          String message, String referenceType, String referenceId);

    PagedResponse<NotificationResponse> getUserNotifications(String userId, int page, int size);

    long getUnreadCount(String userId);

    void markAsRead(String notificationId, String userId);

    void markAllAsRead(String userId);

    void deleteNotification(String notificationId, String userId);

    NotificationPreference getPreferences(String userId);

    NotificationPreference updatePreferences(String userId, NotificationPreferenceRequest request);
}
