package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResourceResponse {

    private String id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String building;
    private String floor;
    private String description;
    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private ResourceStatus status;
    private String imageUrl;
    private Double minBookingHours;
    private Double maxBookingHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
