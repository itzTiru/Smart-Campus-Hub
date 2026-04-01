package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.Priority;
import com.smartcampus.entity.enums.TicketCategory;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TicketRequest {

    private String resourceId;

    @NotBlank(message = "Location is required")
    @Size(max = 255)
    private String location;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private Priority priority;

    @Size(max = 20)
    private String contactPhone;

    @Email(message = "Invalid email format")
    private String contactEmail;
}
