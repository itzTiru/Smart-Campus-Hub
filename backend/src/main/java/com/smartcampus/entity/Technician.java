package com.smartcampus.entity;

import com.smartcampus.entity.enums.TicketCategory;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "technicians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technician {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String passwordHash;

    private String fullName;

    @Indexed(unique = true)
    private String email;

    private String phone;

    @Indexed
    private TicketCategory specialtyCategory;

    @Builder.Default
    private Boolean available = true;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Integer currentActiveJobs = 0;

    private Integer yearsOfExperience;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
