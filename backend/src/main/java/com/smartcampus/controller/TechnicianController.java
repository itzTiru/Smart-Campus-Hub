package com.smartcampus.controller;

import com.smartcampus.dto.request.TechnicianAssignmentResponseRequest;
import com.smartcampus.dto.request.TechnicianMarkDoneRequest;
import com.smartcampus.dto.request.TechnicianProfileUpdateRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TechnicianResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.Technician;
import com.smartcampus.entity.enums.TicketCategory;
import com.smartcampus.entity.enums.TicketStatus;
import com.smartcampus.repository.TechnicianRepository;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/technicians")
@RequiredArgsConstructor
public class TechnicianController {

    private final TechnicianRepository technicianRepository;
    private final TicketService ticketService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TechnicianResponse>>> getTechnicians(
            @RequestParam(required = false) TicketCategory specialtyCategory,
            @RequestParam(required = false) Boolean availableOnly) {

        List<Technician> technicians;
        boolean onlyAvailable = Boolean.TRUE.equals(availableOnly);

        if (specialtyCategory != null && onlyAvailable) {
            technicians = technicianRepository.findBySpecialtyCategoryAndAvailableTrueAndIsActiveTrue(specialtyCategory);
            technicians = technicians.stream()
                    .filter(t -> (t.getCurrentActiveJobs() == null ? 0 : t.getCurrentActiveJobs()) < 4)
                    .toList();
        } else {
            technicians = technicianRepository.findAll().stream()
                    .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                    .filter(t -> specialtyCategory == null || t.getSpecialtyCategory() == specialtyCategory)
                    .filter(t -> !onlyAvailable || Boolean.TRUE.equals(t.getAvailable()))
                    .filter(t -> !onlyAvailable || (t.getCurrentActiveJobs() == null ? 0 : t.getCurrentActiveJobs()) < 4)
                    .toList();
        }

        List<TechnicianResponse> response = technicians.stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Technicians retrieved successfully", response));
    }

    @PatchMapping("/me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TechnicianResponse>> updateMyProfile(
            @Valid @RequestBody TechnicianProfileUpdateRequest request,
            @AuthenticationPrincipal Technician technician) {

        if (request.getPhone() != null) {
            technician.setPhone(request.getPhone());
        }
        if (request.getSpecialtyCategory() != null) {
            technician.setSpecialtyCategory(request.getSpecialtyCategory());
        }
        if (request.getYearsOfExperience() != null) {
            technician.setYearsOfExperience(request.getYearsOfExperience());
        }

        Technician updated = technicianRepository.save(technician);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", mapToResponse(updated)));
    }

    @GetMapping("/me/tickets")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<PagedResponse<TicketResponse>>> getMyAssignedTickets(
            @AuthenticationPrincipal Technician technician,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PagedResponse<TicketResponse> tickets = ticketService.getTicketsForTechnician(
                technician.getId(), status, page, size);
        return ResponseEntity.ok(ApiResponse.success("Technician tickets retrieved successfully", tickets));
    }

    @PatchMapping("/me/tickets/{ticketId}/response")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TicketResponse>> respondToAssignedTicket(
            @PathVariable String ticketId,
            @Valid @RequestBody TechnicianAssignmentResponseRequest request,
            @AuthenticationPrincipal Technician technician) {

        TicketResponse ticket = ticketService.technicianRespondToAssignment(ticketId, technician.getId(), request);
        String message = Boolean.TRUE.equals(request.getAccepted())
                ? "Ticket accepted successfully"
                : "Ticket declined successfully";
        return ResponseEntity.ok(ApiResponse.success(message, ticket));
    }

    @PatchMapping("/me/tickets/{ticketId}/done")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TicketResponse>> markTicketDone(
            @PathVariable String ticketId,
            @RequestBody(required = false) TechnicianMarkDoneRequest request,
            @AuthenticationPrincipal Technician technician) {

        TicketResponse ticket = ticketService.technicianMarkDone(ticketId, technician.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Ticket marked as done successfully", ticket));
    }

    private TechnicianResponse mapToResponse(Technician technician) {
        return TechnicianResponse.builder()
                .id(technician.getId())
                .username(technician.getUsername())
                .fullName(technician.getFullName())
                .email(technician.getEmail())
                .phone(technician.getPhone())
                .specialtyCategory(technician.getSpecialtyCategory())
                .available(technician.getAvailable())
                .isActive(technician.getIsActive())
                .currentActiveJobs(technician.getCurrentActiveJobs())
                .yearsOfExperience(technician.getYearsOfExperience())
                .createdAt(technician.getCreatedAt())
                .build();
    }
}
