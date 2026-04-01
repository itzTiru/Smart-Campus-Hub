package com.smartcampus.dto.response;

import com.smartcampus.entity.enums.RoleName;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserResponse {

    private String id;
    private String email;
    private String name;
    private String avatarUrl;
    private RoleName role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
