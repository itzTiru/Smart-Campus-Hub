package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.Priority;
import com.smartcampus.entity.enums.TicketCategory;
import com.smartcampus.entity.enums.TicketStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TicketResponse {

    private String id;
    private ResourceResponse resource;
    private String location;
    private TicketCategory category;
    private String title;
    private String description;
    private Priority priority;
    private TicketStatus status;
    private UserResponse reporter;
    private UserResponse assignedTo;
    private String contactPhone;
    private String contactEmail;
    private String rejectionReason;
    private String resolutionNotes;
    private LocalDateTime resolvedAt;
    private LocalDateTime firstResponseAt;
    private Long slaResponseHours;
    private Long slaResolutionHours;
    private List<AttachmentResponse> attachments;
    private List<CommentResponse> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
