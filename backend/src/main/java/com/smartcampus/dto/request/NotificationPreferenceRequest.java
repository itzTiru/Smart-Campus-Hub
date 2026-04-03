package com.smartcampus.dto.request;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class NotificationPreferenceRequest {

    private Boolean bookingUpdates;
    private Boolean ticketUpdates;
    private Boolean commentNotifications;
    private Boolean systemNotifications;
}
