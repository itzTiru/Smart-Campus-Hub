package com.smartcampus.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "ticket_attachments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TicketAttachment {

    @Id
    private String id;

    @Indexed
    private String ticketId;

    private String fileName;

    private String filePath;

    private String fileType;

    private Long fileSize;

    @CreatedDate
    private LocalDateTime uploadedAt;
}
