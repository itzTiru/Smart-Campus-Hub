package com.smartcampus.controller;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingReviewRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.enums.BookingStatus;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponse booking = bookingService.createBooking(request, principal.getUser().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking created successfully", booking));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<BookingResponse>>> getAllBookings(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookingResponse> bookings = bookingService.getAllBookings(
                userId, status, resourceId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable String id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved successfully", booking));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBooking(
            @PathVariable String id,
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponse booking = bookingService.updateBooking(id, request, principal.getUser().getId(), principal.hasRole("ADMIN"));
        return ResponseEntity.ok(ApiResponse.success("Booking updated successfully", booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        bookingService.cancelBooking(id, principal.getUser().getId(), principal.hasRole("ADMIN"));
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Booking cancelled successfully", null));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Booking deleted permanently", null));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> approveBooking(
            @PathVariable String id,
            @RequestBody BookingReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponse booking = bookingService.approveBooking(id, request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Booking approved successfully", booking));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> rejectBooking(
            @PathVariable String id,
            @Valid @RequestBody BookingReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        BookingResponse booking = bookingService.rejectBooking(id, request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Booking rejected successfully", booking));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PagedResponse<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookingResponse> bookings = bookingService.getMyBookings(
                principal.getUser().getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("My bookings retrieved successfully", bookings));
    }

    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<ApiResponse<PagedResponse<BookingResponse>>> getBookingsByResource(
            @PathVariable String resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<BookingResponse> bookings = bookingService.getBookingsByResource(
                resourceId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Resource bookings retrieved successfully", bookings));
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<ApiResponse<String>> getQrCode(@PathVariable String id) {
        String qrCode = bookingService.getQrCode(id);
        return ResponseEntity.ok(ApiResponse.success("QR code retrieved successfully", qrCode));
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<ApiResponse<BookingResponse>> checkIn(@PathVariable String id) {
        BookingResponse booking = bookingService.checkIn(id);
        return ResponseEntity.ok(ApiResponse.success("Checked in successfully", booking));
    }

    @GetMapping("/conflicts")
    public ResponseEntity<ApiResponse<Boolean>> checkConflicts(
            @RequestParam String resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        boolean hasConflicts = bookingService.checkConflicts(resourceId, startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success("Conflict check completed", hasConflicts));
    }
}
