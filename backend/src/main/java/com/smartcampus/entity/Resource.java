package com.smartcampus.entity;

import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Document(collection = "resources")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Resource {

    @Id
    private String id;

    private String name;

    @Indexed
    private ResourceType type;

    private Integer capacity;

    @Indexed
    private String location;

    private String building;

    private String floor;

    private String description;

    private LocalTime availabilityStart;

    private LocalTime availabilityEnd;

    @Indexed
    @Builder.Default
    private ResourceStatus status = ResourceStatus.ACTIVE;

    private String imageUrl;

    private Double minBookingHours;  // e.g., 0.5, 1.0

    private Double maxBookingHours;  // e.g., 2.0, 4.0

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
