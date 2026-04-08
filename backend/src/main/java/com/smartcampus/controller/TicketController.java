package com.smartcampus.controller;

import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusUpdateRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.AttachmentResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.enums.Priority;
import com.smartcampus.entity.enums.TicketCategory;
import com.smartcampus.entity.enums.TicketStatus;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(
            @Valid @RequestPart("ticket") TicketRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserPrincipal principal) {

        TicketResponse ticket = ticketService.createTicket(request, images, principal.getUser().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created successfully", ticket));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<TicketResponse>>> getAllTickets(
            @RequestParam(required = false) String reporterId,
            @RequestParam(required = false) String assignedToId,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) TicketCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResponse<TicketResponse> tickets = ticketService.getAllTickets(
                reporterId, assignedToId, resourceId, status, priority, category, page, size);
        return ResponseEntity.ok(ApiResponse.success("Tickets retrieved successfully", tickets));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicketById(@PathVariable String id) {
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket retrieved successfully", ticket));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicket(
            @PathVariable String id,
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        TicketResponse ticket = ticketService.updateTicket(id, request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket updated successfully", ticket));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {

        ticketService.deleteTicket(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<ApiResponse<TicketResponse>> updateTicketStatus(
            @PathVariable String id,
            @Valid @RequestBody TicketStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        TicketResponse ticket = ticketService.updateTicketStatus(id, request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated successfully", ticket));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable String id,
            @RequestParam String technicianId,
            @AuthenticationPrincipal UserPrincipal principal) {

        TicketResponse ticket = ticketService.assignTicket(id, technicianId, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned successfully", ticket));
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        AttachmentResponse attachment = ticketService.uploadAttachment(id, file, principal.getUser().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attachment uploaded successfully", attachment));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String id,
            @PathVariable String attachmentId,
            @AuthenticationPrincipal UserPrincipal principal) {

        ticketService.deleteAttachment(id, attachmentId, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable String id,
            @PathVariable String attachmentId) {

        Resource resource = ticketService.downloadAttachment(id, attachmentId);
        String filename = resource.getFilename() != null ? resource.getFilename() : "attachment";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
