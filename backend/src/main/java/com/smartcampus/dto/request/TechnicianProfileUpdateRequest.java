package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.TicketCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianProfileUpdateRequest {

    @Size(max = 30)
    private String phone;

    private TicketCategory specialtyCategory;

    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 60, message = "Years of experience looks invalid")
    private Integer yearsOfExperience;
}
