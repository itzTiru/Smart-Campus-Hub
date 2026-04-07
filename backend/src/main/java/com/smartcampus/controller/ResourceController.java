package com.smartcampus.controller;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponse>> createResource(
            @Valid @RequestBody ResourceRequest request) {
        ResourceResponse resource = resourceService.createResource(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource created successfully", resource));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ResourceResponse>>> getAllResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<ResourceResponse> resources = resourceService.getAllResources(
                type, status, minCapacity, location, page, size);
        return ResponseEntity.ok(ApiResponse.success("Resources retrieved successfully", resources));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getResourceById(@PathVariable String id) {
        ResourceResponse resource = resourceService.getResourceById(id);
        return ResponseEntity.ok(ApiResponse.success("Resource retrieved successfully", resource));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponse>> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceRequest request) {
        ResourceResponse resource = resourceService.updateResource(id, request);
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", resource));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable String id) {
        resourceService.deleteResource(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Resource deleted successfully", null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ResourceResponse>> toggleStatus(@PathVariable String id) {
        ResourceResponse resource = resourceService.toggleResourceStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Resource status toggled successfully", resource));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedResponse<ResourceResponse>>> searchResources(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<ResourceResponse> resources = resourceService.searchResources(keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success("Search results retrieved successfully", resources));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getAvailableResources(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<ResourceResponse> resources = resourceService.getAvailableResources(startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success("Available resources retrieved successfully", resources));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getResourceSchedule(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<BookingResponse> schedule = resourceService.getResourceSchedule(id, date);
        return ResponseEntity.ok(ApiResponse.success("Resource schedule retrieved successfully", schedule));
    }
}
