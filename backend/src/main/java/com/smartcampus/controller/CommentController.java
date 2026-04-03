package com.smartcampus.controller;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.CommentResponse;
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
            @AuthenticationPrincipal UserPrincipal principal) {

        CommentResponse comment = commentService.addComment(ticketId, request, principal.getUser().getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", comment));
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        CommentResponse comment = commentService.updateComment(ticketId, commentId, request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", comment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserPrincipal principal) {

        boolean isAdmin = principal.hasRole("ADMIN");
        commentService.deleteComment(ticketId, commentId, principal.getUser().getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(
            @PathVariable String ticketId) {

        List<CommentResponse> comments = commentService.getCommentsByTicket(ticketId);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved successfully", comments));
    }
}
