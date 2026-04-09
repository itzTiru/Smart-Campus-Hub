package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.TicketCategory;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianResponse {

    private String id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private TicketCategory specialtyCategory;
    private Boolean available;
    private Boolean isActive;
    private Integer currentActiveJobs;
    private Integer yearsOfExperience;
    private LocalDateTime createdAt;
}
