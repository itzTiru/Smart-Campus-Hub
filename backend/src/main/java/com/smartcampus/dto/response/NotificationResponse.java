package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NotificationResponse {

    private String id;
    private String title;
    private String message;
    private NotificationType type;
    private String referenceType;
    private String referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
