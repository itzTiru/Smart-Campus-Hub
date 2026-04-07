package com.smartcampus.service;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {

    CommentResponse addComment(String ticketId, CommentRequest request, String userId);

    CommentResponse updateComment(String ticketId, String commentId, CommentRequest request, String userId);

    void deleteComment(String ticketId, String commentId, String userId, boolean isAdmin);

    List<CommentResponse> getCommentsByTicket(String ticketId);
}
