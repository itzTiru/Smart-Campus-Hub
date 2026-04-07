package com.smartcampus.service.impl;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.Comment;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.NotificationType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.service.CommentService;
import com.smartcampus.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public CommentResponse addComment(String ticketId, CommentRequest request, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Comment comment = Comment.builder()
                .ticketId(ticketId)
                .user(user)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);

        if (!ticket.getReporter().getId().equals(userId)) {
            if (ticket.getFirstResponseAt() == null) {
                ticket.setFirstResponseAt(LocalDateTime.now());
                ticketRepository.save(ticket);
            }

            notificationService.sendNotification(
                    ticket.getReporter().getId(),
                    NotificationType.NEW_COMMENT,
                    "New Comment on Your Ticket",
                    user.getName() + " commented on your ticket: \"" + ticket.getTitle() + "\"",
                    "TICKET",
                    ticketId
            );
        }

        return mapToResponse(comment);
    }

    @Override
    public CommentResponse updateComment(String ticketId, String commentId, CommentRequest request, String userId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getTicketId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }

        if (!comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        comment = commentRepository.save(comment);

        return mapToResponse(comment);
    }

    @Override
    public void deleteComment(String ticketId, String commentId, String userId, boolean isAdmin) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getTicketId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }

        if (!comment.getUser().getId().equals(userId) && !isAdmin) {
            throw new UnauthorizedException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    @Override
    public List<CommentResponse> getCommentsByTicket(String ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .user(mapUserToResponse(comment.getUser()))
                .content(comment.getContent())
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private UserResponse mapUserToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
