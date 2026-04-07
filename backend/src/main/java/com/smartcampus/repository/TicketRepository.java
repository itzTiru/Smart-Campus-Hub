package com.smartcampus.repository;

import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.enums.TicketStatus;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    @Query("{'reporter': ?0}")
    Page<Ticket> findByReporterId(ObjectId reporterId, Pageable pageable);

    @Query("{'assignedTo': ?0}")
    Page<Ticket> findByAssignedToId(ObjectId technicianId, Pageable pageable);

    Page<Ticket> findByStatus(TicketStatus status, Pageable pageable);
}
