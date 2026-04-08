package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.TicketCategory;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianRegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 4, max = 30, message = "Username must be 4-30 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username can only contain letters, numbers, underscore, dot, and hyphen")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 120)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Size(max = 30)
    private String phone;

    @NotNull(message = "Specialty category is required")
    private TicketCategory specialtyCategory;

    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 60, message = "Years of experience looks invalid")
    private Integer yearsOfExperience;
}
