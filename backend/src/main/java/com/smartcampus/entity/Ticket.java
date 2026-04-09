package com.smartcampus.entity;

import com.smartcampus.entity.enums.Priority;
import com.smartcampus.entity.enums.TicketCategory;
import com.smartcampus.entity.enums.TicketStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

@Document(collection = "tickets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Ticket {

    @Id
    private String id;

    @DocumentReference
    private Resource resource;

    private String location;

    @Indexed
    private TicketCategory category;

    private String title;

    private String description;

    @Indexed
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Indexed
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Indexed
    @DocumentReference
    private User reporter;

    @Indexed
    @DocumentReference
    private User assignedTo;

    private String assignedTechnicianId;

    private String assignedTechnicianName;

    private String contactPhone;

    private String contactEmail;

    private String rejectionReason;

    private String technicianDeclineReason;

    private String resolutionNotes;

    private LocalDateTime resolvedAt;

    private LocalDateTime firstResponseAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
