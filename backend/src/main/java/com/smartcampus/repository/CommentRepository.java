package com.smartcampus.repository;

import com.smartcampus.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    List<Comment> findByTicketIdOrderByCreatedAtAsc(String ticketId);

    Page<Comment> findByTicketId(String ticketId, Pageable pageable);

    void deleteByTicketId(String ticketId);
}
