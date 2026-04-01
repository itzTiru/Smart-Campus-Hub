package com.smartcampus.dto.request;

import com.smartcampus.entity.enums.RoleName;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RoleUpdateRequest {

    @NotNull(message = "Role is required")
    private RoleName role;
}
