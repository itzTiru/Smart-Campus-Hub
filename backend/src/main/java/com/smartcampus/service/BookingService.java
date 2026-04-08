package com.smartcampus.service;

import com.smartcampus.dto.request.BookingRequest;
import com.smartcampus.dto.request.BookingReviewRequest;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.enums.BookingStatus;

import java.time.LocalDateTime;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userId);

    PagedResponse<BookingResponse> getAllBookings(String userId, BookingStatus status,
                                                  String resourceId, int page, int size);

    BookingResponse getBookingById(String id);

    BookingResponse updateBooking(String id, BookingRequest request, String userId);

    void cancelBooking(String id, String userId);

    BookingResponse approveBooking(String id, BookingReviewRequest request, String adminId);

    BookingResponse rejectBooking(String id, BookingReviewRequest request, String adminId);

    PagedResponse<BookingResponse> getMyBookings(String userId, int page, int size);

    PagedResponse<BookingResponse> getBookingsByResource(String resourceId, int page, int size);

    boolean checkConflicts(String resourceId, LocalDateTime startTime, LocalDateTime endTime);

    String getQrCode(String id);

    BookingResponse checkIn(String id);
}
