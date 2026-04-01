package com.smartcampus.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BookingReviewRequest {

    @Size(max = 500)
    private String remarks;
}
