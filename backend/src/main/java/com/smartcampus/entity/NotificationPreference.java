package com.smartcampus.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notification_preferences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Builder.Default
    private Boolean bookingUpdates = true;

    @Builder.Default
    private Boolean ticketUpdates = true;

    @Builder.Default
    private Boolean commentNotifications = true;

    @Builder.Default
    private Boolean systemNotifications = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
