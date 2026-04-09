package com.smartcampus.service;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingReviewRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.entity.*;
import com.smartcampus.entity.enums.BookingStatus;
import com.smartcampus.entity.enums.ResourceStatus;
import com.smartcampus.entity.enums.ResourceType;
import com.smartcampus.entity.enums.RoleName;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.BookingConflictException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Resource resource;
    private User user;
    private User admin;
    private Booking booking;
    private BookingRequest request;
    private Role userRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id("r1").name(RoleName.USER).build();
        adminRole = Role.builder().id("r2").name(RoleName.ADMIN).build();

        resource = Resource.builder()
                .id("res1").name("Lab 1").type(ResourceType.LAB)
                .location("Block B").status(ResourceStatus.ACTIVE).build();

        user = User.builder()
                .id("u1").email("user@test.com").name("Test User")
                .oauthProviderId("google-123").role(userRole).isActive(true).build();

        admin = User.builder()
                .id("u2").email("admin@test.com").name("Admin User")
                .oauthProviderId("google-456").role(adminRole).isActive(true).build();

        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(2);

        booking = Booking.builder()
                .id("b1").resource(resource).user(user)
                .startTime(start).endTime(end)
                .purpose("Database Lab").expectedAttendees(30)
                .status(BookingStatus.PENDING).build();

        request = BookingRequest.builder()
                .resourceId("res1").startTime(start).endTime(end)
                .purpose("Database Lab").expectedAttendees(30).build();
    }

    @Test
    @DisplayName("Should create booking successfully when no conflicts")
    void createBooking_Success() {
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(resource));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(bookingRepository.countActiveBookingsByUser(any())).thenReturn(0L);
        when(bookingRepository.findConflictingBookings(any(), any(), any())).thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingResponse response = bookingService.createBooking(request, "u1");

        assertThat(response).isNotNull();
        assertThat(response.getPurpose()).isEqualTo("Database Lab");
        assertThat(response.getStatus()).isEqualTo(BookingStatus.PENDING);
    }

    @Test
    @DisplayName("Should throw BookingConflictException when time slot conflicts")
    void createBooking_Conflict() {
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(resource));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(bookingRepository.countActiveBookingsByUser(any())).thenReturn(0L);
        when(bookingRepository.findConflictingBookings(any(), any(), any())).thenReturn(List.of(booking));

        assertThatThrownBy(() -> bookingService.createBooking(request, "u1"))
                .isInstanceOf(BookingConflictException.class);
    }

    @Test
    @DisplayName("Should throw BadRequestException when start time is after end time")
    void createBooking_InvalidTimeRange() {
        request.setStartTime(LocalDateTime.now().plusDays(2));
        request.setEndTime(LocalDateTime.now().plusDays(1));

        assertThatThrownBy(() -> bookingService.createBooking(request, "u1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Start time must be before end time");
    }

    @Test
    @DisplayName("Should throw BadRequestException when resource is OUT_OF_SERVICE")
    void createBooking_ResourceUnavailable() {
        resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
        when(resourceRepository.findById("res1")).thenReturn(Optional.of(resource));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bookingService.createBooking(request, "u1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
    }

    @Test
    @DisplayName("Should cancel own booking")
    void cancelBooking_Success() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        bookingService.cancelBooking("b1", "u1", false);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(bookingRepository).save(booking);
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when cancelling another user's booking")
    void cancelBooking_Unauthorized() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("b1", "u99", false))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Admin should cancel any booking")
    void cancelBooking_AdminSuccess() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        bookingService.cancelBooking("b1", "admin-id", true);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        verify(bookingRepository).save(booking);
    }

    @Test
    @DisplayName("Should not cancel already cancelled booking")
    void cancelBooking_AlreadyCancelled() {
        booking.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("b1", "u1", false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already cancelled");
    }

    @Test
    @DisplayName("Should not cancel rejected booking")
    void cancelBooking_Rejected() {
        booking.setStatus(BookingStatus.REJECTED);
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("b1", "u1", false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("rejected");
    }

    @Test
    @DisplayName("Should approve pending booking with conflict re-check")
    void approveBooking_Success() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(bookingRepository.findConflictingBookingsExcluding(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        when(userRepository.findById("u2")).thenReturn(Optional.of(admin));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingReviewRequest reviewRequest = new BookingReviewRequest();
        reviewRequest.setRemarks("Approved for lab session");

        bookingService.approveBooking("b1", reviewRequest, "u2");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.APPROVED);
        verify(notificationService).sendNotification(eq("u1"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject pending booking")
    void rejectBooking_Success() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));
        when(userRepository.findById("u2")).thenReturn(Optional.of(admin));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        BookingReviewRequest reviewRequest = new BookingReviewRequest();
        reviewRequest.setRemarks("Room under maintenance");

        bookingService.rejectBooking("b1", reviewRequest, "u2");

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.REJECTED);
        verify(notificationService).sendNotification(eq("u1"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should not approve non-pending booking")
    void approveBooking_NotPending() {
        booking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.approveBooking("b1", new BookingReviewRequest(), "u2"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only pending");
    }

    @Test
    @DisplayName("Should get booking by ID")
    void getBookingById_Success() {
        when(bookingRepository.findById("b1")).thenReturn(Optional.of(booking));

        BookingResponse response = bookingService.getBookingById("b1");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("b1");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for invalid booking ID")
    void getBookingById_NotFound() {
        when(bookingRepository.findById("b99")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingById("b99"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
