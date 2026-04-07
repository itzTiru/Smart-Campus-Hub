package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TicketStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    private String resolutionNotes;

    private String rejectionReason;
}
