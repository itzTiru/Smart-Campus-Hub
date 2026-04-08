package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.BookingStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BookingResponse {

    private String id;
    private ResourceResponse resource;
    private UserResponse user;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    private BookingStatus status;
    private String adminRemarks;
    private Boolean checkedIn;
    private LocalDateTime checkedInAt;
    private String qrCodeUrl;
    private UserResponse reviewedBy;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
