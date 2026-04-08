package com.smartcampus.service.impl;

import com.smartcampus.dto.request.ResourceRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public ResourceResponse createResource(ResourceRequest request) {
        Resource resource = mapToEntity(request);
        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    public PagedResponse<ResourceResponse> getAllResources(ResourceType type, ResourceStatus status,
                                                           Integer minCapacity, String location,
                                                           int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Query query = new Query();
        if (type != null) query.addCriteria(Criteria.where("type").is(type));
        if (status != null) query.addCriteria(Criteria.where("status").is(status));
        if (minCapacity != null) query.addCriteria(Criteria.where("capacity").gte(minCapacity));
        if (location != null) query.addCriteria(Criteria.where("location").regex(location, "i"));
        query.with(pageable);

        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Resource.class);

        Page<Resource> resourcePage = PageableExecutionUtils.getPage(resources, pageable, () -> total);
        return mapToPagedResponse(resourcePage);
    }

    @Override
    public ResourceResponse getResourceById(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));
        return mapToResponse(resource);
    }

    @Override
    public ResourceResponse updateResource(String id, ResourceRequest request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));

        resource.setName(request.getName());
        resource.setType(request.getType());
        resource.setCapacity(request.getCapacity());
        resource.setLocation(request.getLocation());
        resource.setBuilding(request.getBuilding());
        resource.setFloor(request.getFloor());
        resource.setDescription(request.getDescription());
        resource.setAvailabilityStart(request.getAvailabilityStart());
        resource.setAvailabilityEnd(request.getAvailabilityEnd());
        resource.setImageUrl(request.getImageUrl());
        resource.setMinBookingHours(request.getMinBookingHours());
        resource.setMaxBookingHours(request.getMaxBookingHours());

        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    public void deleteResource(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));
        resourceRepository.delete(resource);
    }

    @Override
    public ResourceResponse toggleResourceStatus(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", id));

        if (resource.getStatus() == ResourceStatus.ACTIVE) {
            resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        } else {
            resource.setStatus(ResourceStatus.ACTIVE);
        }

        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    public PagedResponse<ResourceResponse> searchResources(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Criteria criteria = new Criteria().orOperator(
                Criteria.where("name").regex(keyword, "i"),
                Criteria.where("location").regex(keyword, "i"),
                Criteria.where("building").regex(keyword, "i"),
                Criteria.where("description").regex(keyword, "i")
        );
        Query query = new Query(criteria).with(pageable);

        List<Resource> resources = mongoTemplate.find(query, Resource.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Resource.class);

        Page<Resource> resourcePage = PageableExecutionUtils.getPage(resources, pageable, () -> total);
        return mapToPagedResponse(resourcePage);
    }

    @Override
    public List<BookingResponse> getResourceSchedule(String resourceId, LocalDate date) {
        // Verify resource exists
        resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", resourceId));

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

        List<Booking> bookings = bookingRepository.findByResourceAndDate(new org.bson.types.ObjectId(resourceId), dayStart, dayEnd);

        return bookings.stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ResourceResponse> getAvailableResources(LocalDateTime startTime, LocalDateTime endTime) {
        List<Booking> conflicting = bookingRepository.findAllConflictingInRange(startTime, endTime);
        List<String> excludedIds = conflicting.stream()
                .map(b -> b.getResource().getId())
                .distinct()
                .collect(Collectors.toList());

        List<Resource> resources;
        if (excludedIds.isEmpty()) {
            resources = resourceRepository.findByStatus(ResourceStatus.ACTIVE,
                    PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        } else {
            resources = resourceRepository.findAvailableExcluding(excludedIds);
        }

        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── Private helper methods ──────────────────────────────────────────

    private Resource mapToEntity(ResourceRequest request) {
        return Resource.builder()
                .name(request.getName())
                .type(request.getType())
                .capacity(request.getCapacity())
                .location(request.getLocation())
                .building(request.getBuilding())
                .floor(request.getFloor())
                .description(request.getDescription())
                .availabilityStart(request.getAvailabilityStart())
                .availabilityEnd(request.getAvailabilityEnd())
                .imageUrl(request.getImageUrl())
                .minBookingHours(request.getMinBookingHours())
                .maxBookingHours(request.getMaxBookingHours())
                .status(ResourceStatus.ACTIVE)
                .build();
    }

    private ResourceResponse mapToResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .building(resource.getBuilding())
                .floor(resource.getFloor())
                .description(resource.getDescription())
                .availabilityStart(resource.getAvailabilityStart())
                .availabilityEnd(resource.getAvailabilityEnd())
                .status(resource.getStatus())
                .imageUrl(resource.getImageUrl())
                .minBookingHours(resource.getMinBookingHours())
                .maxBookingHours(resource.getMaxBookingHours())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    private PagedResponse<ResourceResponse> mapToPagedResponse(Page<Resource> page) {
        List<ResourceResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<ResourceResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private BookingResponse mapToBookingResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .resource(mapToResponse(booking.getResource()))
                .user(mapToUserResponse(booking.getUser()))
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .adminRemarks(booking.getAdminRemarks())
                .reviewedBy(booking.getReviewedBy() != null ? mapToUserResponse(booking.getReviewedBy()) : null)
                .reviewedAt(booking.getReviewedAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().getName())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
