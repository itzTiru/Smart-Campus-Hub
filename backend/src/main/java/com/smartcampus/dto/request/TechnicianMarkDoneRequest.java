package com.smartcampus.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianMarkDoneRequest {

    private String resolutionNotes;
}
