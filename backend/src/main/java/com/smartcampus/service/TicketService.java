package com.smartcampus.service;

import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusUpdateRequest;
import com.smartcampus.dto.response.AttachmentResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.enums.Priority;
import com.smartcampus.entity.enums.TicketCategory;
import com.smartcampus.entity.enums.TicketStatus;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(TicketRequest request, List<MultipartFile> images, String userId);

    PagedResponse<TicketResponse> getAllTickets(String reporterId, String assignedToId, String resourceId,
                                                TicketStatus status, Priority priority,
                                                TicketCategory category, int page, int size);

    TicketResponse getTicketById(String id);

    TicketResponse updateTicket(String id, TicketRequest request, String userId);

    void deleteTicket(String id, String userId);

    TicketResponse updateTicketStatus(String id, TicketStatusUpdateRequest request, String userId);

    TicketResponse assignTicket(String id, String technicianId, String adminId);

    AttachmentResponse uploadAttachment(String ticketId, MultipartFile file, String userId);

    void deleteAttachment(String ticketId, String attachmentId, String userId);

    Resource downloadAttachment(String ticketId, String attachmentId);
}
