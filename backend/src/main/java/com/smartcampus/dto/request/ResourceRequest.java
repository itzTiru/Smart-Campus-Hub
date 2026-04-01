package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.ResourceType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResourceRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255)
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    @Size(max = 255)
    private String location;

    @Size(max = 100)
    private String building;

    @Size(max = 20)
    private String floor;

    private String description;

    private LocalTime availabilityStart;

    private LocalTime availabilityEnd;

    private String imageUrl;

    private Double minBookingHours;

    private Double maxBookingHours;
}
