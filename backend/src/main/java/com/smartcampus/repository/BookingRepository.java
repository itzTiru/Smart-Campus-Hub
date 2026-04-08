package com.smartcampus.repository;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.enums.BookingStatus;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    @Query("{'user': ?0}")
    Page<Booking> findByUserId(ObjectId userId, Pageable pageable);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    @Query("{'resource': ?0}")
    Page<Booking> findByResourceId(ObjectId resourceId, Pageable pageable);

    @Query(value = "{'resource': ?0}", count = true)
    long countByResourceId(ObjectId resourceId);

    @Query(value = "{'resource': ?0, 'status': ?1}", count = true)
    long countByResourceIdAndStatus(ObjectId resourceId, BookingStatus status);

    @Query("{'resource': ?0, 'status': {$in: ['PENDING', 'APPROVED']}, 'startTime': {$lt: ?2}, 'endTime': {$gt: ?1}}")
    List<Booking> findConflictingBookings(ObjectId resourceId, LocalDateTime startTime, LocalDateTime endTime);

    @Query("{'resource': ?0, 'status': {$in: ['PENDING', 'APPROVED']}, 'startTime': {$lt: ?2}, 'endTime': {$gt: ?1}, '_id': {$ne: ?3}}")
    List<Booking> findConflictingBookingsExcluding(ObjectId resourceId, LocalDateTime startTime, LocalDateTime endTime, ObjectId excludeId);

    @Query("{'resource': ?0, 'status': 'APPROVED', 'startTime': {$gte: ?1, $lte: ?2}}")
    List<Booking> findApprovedBookingsForResourceInRange(ObjectId resourceId, LocalDateTime from, LocalDateTime to);

    @Query("{'status': {$in: ['PENDING', 'APPROVED']}, 'startTime': {$lt: ?1}, 'endTime': {$gt: ?0}}")
    List<Booking> findAllConflictingInRange(LocalDateTime startTime, LocalDateTime endTime);

    @Query("{'resource': ?0, 'status': {$in: ['PENDING', 'APPROVED']}, 'startTime': {$gte: ?1, $lt: ?2}}")
    List<Booking> findByResourceAndDate(ObjectId resourceId, LocalDateTime dayStart, LocalDateTime dayEnd);

    @Query(value = "{'user': ?0, 'status': {$in: ['PENDING', 'APPROVED']}}", count = true)
    long countActiveBookingsByUser(ObjectId userId);
}
