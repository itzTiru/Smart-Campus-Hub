package com.smartcampus.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianAssignmentResponseRequest {

    @NotNull(message = "Accepted flag is required")
    private Boolean accepted;

    private String declineReason;
}
