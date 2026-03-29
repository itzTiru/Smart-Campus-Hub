package com.smartcampus.entity;

import com.smartcampus.entity.enums.NotificationType;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@CompoundIndex(name = "idx_notification_user_read", def = "{'userId': 1, 'isRead': 1}")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String message;

    private NotificationType type;

    private String referenceType;

    private String referenceId;

    @Builder.Default
    private Boolean isRead = false;

    @Indexed
    @CreatedDate
    private LocalDateTime createdAt;
}
