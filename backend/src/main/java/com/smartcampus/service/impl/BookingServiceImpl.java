package com.smartcampus.service.impl;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingReviewRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.ResourceResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Resource;
import org.bson.types.ObjectId;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.BookingStatus;
import com.smartcampus.entity.enums.NotificationType;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.BookingService;
import com.smartcampus.service.NotificationService;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MongoTemplate mongoTemplate;

    @Override
    public BookingResponse createBooking(BookingRequest request, String userId) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Time slot intervals - must be on :00 or :30
        if (request.getStartTime().getMinute() % 30 != 0 || request.getEndTime().getMinute() % 30 != 0) {
            throw new BadRequestException("Booking times must be on the hour or half-hour (:00 or :30)");
        }

        // No past bookings
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book in the past");
        }

        // Max 2 weeks ahead
        if (request.getStartTime().isAfter(LocalDateTime.now().plusWeeks(2))) {
            throw new BadRequestException("Cannot book more than 2 weeks in advance");
        }

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", request.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new BadRequestException("Resource is not available for booking");
        }

        // Duration limits based on resource
        long durationMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        double durationHours = durationMinutes / 60.0;

        if (resource.getMinBookingHours() != null && durationHours < resource.getMinBookingHours()) {
            throw new BadRequestException("Minimum booking duration for this resource is " + resource.getMinBookingHours() + " hours");
        }
        if (resource.getMaxBookingHours() != null && durationHours > resource.getMaxBookingHours()) {
            throw new BadRequestException("Maximum booking duration for this resource is " + resource.getMaxBookingHours() + " hours");
        }

        // Must be within resource availability hours
        if (resource.getAvailabilityStart() != null && request.getStartTime().toLocalTime().isBefore(resource.getAvailabilityStart())) {
            throw new BadRequestException("Booking starts before resource availability (" + resource.getAvailabilityStart() + ")");
        }
        if (resource.getAvailabilityEnd() != null && request.getEndTime().toLocalTime().isAfter(resource.getAvailabilityEnd())) {
            throw new BadRequestException("Booking ends after resource availability (" + resource.getAvailabilityEnd() + ")");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Max 5 active bookings per user
        long activeCount = bookingRepository.countActiveBookingsByUser(new ObjectId(userId));
        if (activeCount >= 5) {
            throw new BadRequestException("You have reached the maximum of 5 active bookings. Cancel or wait for existing bookings to complete.");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                new ObjectId(resource.getId()), request.getStartTime(), request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "The requested time slot conflicts with an existing booking for this resource");
        }

        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Override
    public PagedResponse<BookingResponse> getAllBookings(String userId, BookingStatus status,
                                                         String resourceId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Query query = new Query();
        if (userId != null) query.addCriteria(Criteria.where("user").is(new org.bson.types.ObjectId(userId)));
        if (status != null) query.addCriteria(Criteria.where("status").is(status));
        if (resourceId != null) query.addCriteria(Criteria.where("resource").is(new org.bson.types.ObjectId(resourceId)));
        query.with(pageable);

        List<Booking> bookings = mongoTemplate.find(query, Booking.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Booking.class);

        Page<Booking> bookingPage = PageableExecutionUtils.getPage(bookings, pageable, () -> total);
        return mapToPagedResponse(bookingPage);
    }

    @Override
    public BookingResponse getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
        return mapToResponse(booking);
    }

    @Override
    public BookingResponse updateBooking(String id, BookingRequest request, String userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (!booking.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only update your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be updated");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }

        // Time slot intervals - must be on :00 or :30
        if (request.getStartTime().getMinute() % 30 != 0 || request.getEndTime().getMinute() % 30 != 0) {
            throw new BadRequestException("Booking times must be on the hour or half-hour (:00 or :30)");
        }

        // No past bookings
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book in the past");
        }

        // Max 2 weeks ahead
        if (request.getStartTime().isAfter(LocalDateTime.now().plusWeeks(2))) {
            throw new BadRequestException("Cannot book more than 2 weeks in advance");
        }

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", request.getResourceId()));

        if (resource.getStatus() != ResourceStatus.ACTIVE) {
            throw new BadRequestException("Resource is not available for booking");
        }

        // Duration limits based on resource
        long durationMinutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        double durationHours = durationMinutes / 60.0;

        if (resource.getMinBookingHours() != null && durationHours < resource.getMinBookingHours()) {
            throw new BadRequestException("Minimum booking duration for this resource is " + resource.getMinBookingHours() + " hours");
        }
        if (resource.getMaxBookingHours() != null && durationHours > resource.getMaxBookingHours()) {
            throw new BadRequestException("Maximum booking duration for this resource is " + resource.getMaxBookingHours() + " hours");
        }

        // Must be within resource availability hours
        if (resource.getAvailabilityStart() != null && request.getStartTime().toLocalTime().isBefore(resource.getAvailabilityStart())) {
            throw new BadRequestException("Booking starts before resource availability (" + resource.getAvailabilityStart() + ")");
        }
        if (resource.getAvailabilityEnd() != null && request.getEndTime().toLocalTime().isAfter(resource.getAvailabilityEnd())) {
            throw new BadRequestException("Booking ends after resource availability (" + resource.getAvailabilityEnd() + ")");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                new ObjectId(resource.getId()), request.getStartTime(), request.getEndTime(), new ObjectId(id));

        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "The requested time slot conflicts with an existing booking for this resource");
        }

        booking.setResource(resource);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    public void cancelBooking(String id, String userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (!booking.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        if (booking.getStatus() == BookingStatus.REJECTED) {
            throw new BadRequestException("Cannot cancel a rejected booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    @Override
    public BookingResponse approveBooking(String id, BookingReviewRequest request, String adminId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be approved");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcluding(
                new ObjectId(booking.getResource().getId()), booking.getStartTime(), booking.getEndTime(), new ObjectId(booking.getId()));
        if (!conflicts.isEmpty()) {
            throw new BookingConflictException(
                    "Cannot approve: the time slot now conflicts with another approved booking");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());
        if (request.getRemarks() != null) {
            booking.setAdminRemarks(request.getRemarks());
        }

        // Generate QR code check-in URL on approval
        String qrCodeUrl = "http://localhost:5173/bookings/" + booking.getId() + "/checkin";
        booking.setQrCode(qrCodeUrl);

        Booking updated = bookingRepository.save(booking);

        notificationService.sendNotification(
                booking.getUser().getId(),
                NotificationType.BOOKING_APPROVED,
                "Booking Approved",
                "Your booking for " + booking.getResource().getName() + " has been approved.",
                "BOOKING",
                booking.getId()
        );

        return mapToResponse(updated);
    }

    @Override
    public BookingResponse rejectBooking(String id, BookingReviewRequest request, String adminId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setAdminRemarks(request.getRemarks());

        Booking updated = bookingRepository.save(booking);

        notificationService.sendNotification(
                booking.getUser().getId(),
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                "Your booking for " + booking.getResource().getName() + " has been rejected."
                        + (request.getRemarks() != null ? " Reason: " + request.getRemarks() : ""),
                "BOOKING",
                booking.getId()
        );

        return mapToResponse(updated);
    }

    @Override
    public PagedResponse<BookingResponse> getMyBookings(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Booking> bookingPage = bookingRepository.findByUserId(new ObjectId(userId), pageable);
        return mapToPagedResponse(bookingPage);
    }

    @Override
    public PagedResponse<BookingResponse> getBookingsByResource(String resourceId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Booking> bookingPage = bookingRepository.findByResourceId(new ObjectId(resourceId), pageable);
        return mapToPagedResponse(bookingPage);
    }

    @Override
    public boolean checkConflicts(String resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(new ObjectId(resourceId), startTime, endTime);
        return !conflicts.isEmpty();
    }

    @Override
    public String getQrCode(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("QR code is only available for approved bookings");
        }

        if (booking.getQrCode() == null) {
            // Generate if missing (e.g., bookings approved before this feature)
            String qrCodeUrl = "http://localhost:5173/bookings/" + booking.getId() + "/checkin";
            booking.setQrCode(qrCodeUrl);
            bookingRepository.save(booking);
        }

        return booking.getQrCode();
    }

    @Override
    public BookingResponse checkIn(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException("Only approved bookings can be checked in");
        }

        if (Boolean.TRUE.equals(booking.getCheckedIn())) {
            throw new BadRequestException("This booking has already been checked in");
        }

        // Validate check-in is within a reasonable window (30 minutes before to end of booking)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime earliestCheckIn = booking.getStartTime().minusMinutes(30);
        LocalDateTime latestCheckIn = booking.getEndTime();

        if (now.isBefore(earliestCheckIn)) {
            throw new BadRequestException("Check-in is not yet available. You can check in starting 30 minutes before the booking at " + earliestCheckIn);
        }

        if (now.isAfter(latestCheckIn)) {
            throw new BadRequestException("Check-in window has expired. The booking ended at " + latestCheckIn);
        }

        booking.setCheckedIn(true);
        booking.setCheckedInAt(now);

        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    // ── Private helper methods ──────────────────────────────────────────

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .resource(mapToResourceResponse(booking.getResource()))
                .user(mapToUserResponse(booking.getUser()))
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .adminRemarks(booking.getAdminRemarks())
                .checkedIn(booking.getCheckedIn())
                .checkedInAt(booking.getCheckedInAt())
                .qrCodeUrl(booking.getQrCode())
                .reviewedBy(booking.getReviewedBy() != null ? mapToUserResponse(booking.getReviewedBy()) : null)
                .reviewedAt(booking.getReviewedAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private ResourceResponse mapToResourceResponse(Resource resource) {
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

    private PagedResponse<BookingResponse> mapToPagedResponse(Page<Booking> page) {
        List<BookingResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<BookingResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
