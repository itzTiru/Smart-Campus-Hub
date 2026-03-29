package com.smartcampus.entity;

import com.smartcampus.entity.enums.BookingStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

@Document(collection = "bookings")
@CompoundIndex(name = "idx_booking_conflict", def = "{'resource': 1, 'startTime': 1, 'endTime': 1, 'status': 1}")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Booking {

    @Id
    private String id;

    @DocumentReference
    private Resource resource;

    @Indexed
    @DocumentReference
    private User user;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String purpose;

    private Integer expectedAttendees;

    @Indexed
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    private String adminRemarks;

    private String qrCode;

    @Builder.Default
    private Boolean checkedIn = false;

    private LocalDateTime checkedInAt;

    @DocumentReference
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
