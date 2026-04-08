package com.smartcampus.controller;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.entity.Technician;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Object principal) {

        String actorId = extractActorId(principal);
        String actorType = extractActorType(principal);
        CommentResponse comment = commentService.addComment(ticketId, request, actorId, actorType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", comment));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Object principal) {

        String actorId = extractActorId(principal);
        String actorType = extractActorType(principal);
        CommentResponse comment = commentService.updateComment(ticketId, commentId, request, actorId, actorType);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", comment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal Object principal) {

        boolean isAdmin = principal instanceof UserPrincipal userPrincipal && userPrincipal.hasRole("ADMIN");
        String actorId = extractActorId(principal);
        String actorType = extractActorType(principal);
        commentService.deleteComment(ticketId, commentId, actorId, actorType, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable String ticketId) {

        List<CommentResponse> comments = commentService.getCommentsByTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully", comments));
    }

    private String extractActorId(Object principal) {
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getUser().getId();
        }
        if (principal instanceof Technician technician) {
            return technician.getId();
        }
        throw new UnauthorizedException("Unauthorized");
    }

    private String extractActorType(Object principal) {
        if (principal instanceof UserPrincipal) {
            return "USER";
        }
        if (principal instanceof Technician) {
            return "TECHNICIAN";
        }
        throw new UnauthorizedException("Unauthorized");
    }
}
