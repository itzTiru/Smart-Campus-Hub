package com.smartcampus.entity;

import com.smartcampus.entity.enums.RoleName;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "roles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Role {

    @Id
    private String id;

    @Indexed(unique = true)
    private RoleName name;

    private String description;

    @CreatedDate
    private LocalDateTime createdAt;
}
