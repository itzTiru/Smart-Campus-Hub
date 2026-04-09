package com.smartcampus.service.impl;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.Comment;
import com.smartcampus.entity.Technician;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.RoleName;
import com.smartcampus.entity.enums.NotificationType;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TechnicianRepository;
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
    private final TechnicianRepository technicianRepository;
    private final NotificationService notificationService;

    @Override
    public CommentResponse addComment(String ticketId, CommentRequest request, String actorId, String actorType) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        Comment comment;
        String actorDisplayName;
        boolean shouldNotifyReporter;

        if ("TECHNICIAN".equals(actorType)) {
            Technician technician = technicianRepository.findById(actorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Technician", "id", actorId));
            if (!actorId.equals(ticket.getAssignedTechnicianId())) {
                throw new UnauthorizedException("Technician can only comment on assigned tickets");
            }

            comment = Comment.builder()
                    .ticketId(ticketId)
                    .actorType("TECHNICIAN")
                    .technicianId(technician.getId())
                    .technicianName(technician.getFullName())
                    .technicianEmail(technician.getEmail())
                    .content(request.getContent())
                    .build();
            actorDisplayName = technician.getFullName();
            shouldNotifyReporter = !ticket.getReporter().getId().equals(actorId);
        } else {
            User user = userRepository.findById(actorId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorId));

            comment = Comment.builder()
                    .ticketId(ticketId)
                    .actorType("USER")
                    .user(user)
                    .content(request.getContent())
                    .build();
            actorDisplayName = user.getName();
            shouldNotifyReporter = !ticket.getReporter().getId().equals(actorId);
        }

        comment = commentRepository.save(comment);

        if (shouldNotifyReporter) {
            if (ticket.getFirstResponseAt() == null) {
                ticket.setFirstResponseAt(LocalDateTime.now());
                ticketRepository.save(ticket);
            }

            notificationService.sendNotification(
                    ticket.getReporter().getId(),
                    NotificationType.NEW_COMMENT,
                    "New Comment on Your Ticket",
                    actorDisplayName + " commented on your ticket: \"" + ticket.getTitle() + "\"",
                    "TICKET",
                    ticketId
            );
        }

        return mapToResponse(comment);
    }

    @Override
    public CommentResponse updateComment(String ticketId, String commentId, CommentRequest request,
                                         String actorId, String actorType) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getTicketId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }

        if (!isCommentOwner(comment, actorId, actorType)) {
            throw new UnauthorizedException("You can only edit your own comments");
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        comment = commentRepository.save(comment);

        return mapToResponse(comment);
    }

    @Override
    public void deleteComment(String ticketId, String commentId, String actorId, String actorType, boolean isAdmin) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", "id", commentId));

        if (!comment.getTicketId().equals(ticketId)) {
            throw new ResourceNotFoundException("Comment", "id", commentId);
        }

        if (!isCommentOwner(comment, actorId, actorType) && !isAdmin) {
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
        UserResponse author = comment.getUser() != null
                ? mapUserToResponse(comment.getUser())
                : mapTechnicianToUserResponse(comment);

        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .user(author)
                .content(comment.getContent())
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private boolean isCommentOwner(Comment comment, String actorId, String actorType) {
        if ("TECHNICIAN".equals(actorType)) {
            return actorId.equals(comment.getTechnicianId());
        }

        return comment.getUser() != null && actorId.equals(comment.getUser().getId());
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

    private UserResponse mapTechnicianToUserResponse(Comment comment) {
        return UserResponse.builder()
                .id(comment.getTechnicianId())
                .email(comment.getTechnicianEmail())
                .name(comment.getTechnicianName())
                .role(RoleName.TECHNICIAN)
                .isActive(true)
                .build();
    }
}
