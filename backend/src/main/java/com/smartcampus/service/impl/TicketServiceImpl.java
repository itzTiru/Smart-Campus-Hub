package com.smartcampus.service.impl;

import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusUpdateRequest;
import com.smartcampus.dto.response.*;
import com.smartcampus.entity.*;
import com.smartcampus.entity.enums.*;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.*;
import com.smartcampus.service.FileStorageService;
import com.smartcampus.service.NotificationService;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final int MAX_ATTACHMENTS = 3;

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final CommentRepository commentRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final MongoTemplate mongoTemplate;

    @Override
    public TicketResponse createTicket(TicketRequest request, List<MultipartFile> images, String userId) {
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .category(request.getCategory())
                .priority(request.getPriority() != null ? request.getPriority() : Priority.MEDIUM)
                .status(TicketStatus.OPEN)
                .reporter(reporter)
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .build();

        if (request.getResourceId() != null) {
            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", request.getResourceId()));
            ticket.setResource(resource);
        }

        ticket = ticketRepository.save(ticket);

        if (images != null && !images.isEmpty()) {
            if (images.size() > MAX_ATTACHMENTS) {
                throw new BadRequestException("Maximum " + MAX_ATTACHMENTS + " image attachments allowed");
            }
            for (MultipartFile image : images) {
                if (!fileStorageService.isValidImageType(image.getContentType())) {
                    throw new BadRequestException("Invalid file type: " + image.getOriginalFilename()
                            + ". Only image files are allowed");
                }
                String filePath = fileStorageService.storeFile(image);
                TicketAttachment attachment = TicketAttachment.builder()
                        .ticketId(ticket.getId())
                        .fileName(image.getOriginalFilename())
                        .filePath(filePath)
                        .fileType(image.getContentType())
                        .fileSize(image.getSize())
                        .build();
                ticketAttachmentRepository.save(attachment);
            }
        }

        return mapToResponse(ticket);
    }

    @Override
    public PagedResponse<TicketResponse> getAllTickets(String reporterId, String assignedToId, String resourceId,
                                                       TicketStatus status, Priority priority,
                                                       TicketCategory category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Query query = new Query();
        if (reporterId != null) query.addCriteria(Criteria.where("reporter").is(new org.bson.types.ObjectId(reporterId)));
        if (assignedToId != null) query.addCriteria(Criteria.where("assignedTo").is(new org.bson.types.ObjectId(assignedToId)));
        if (resourceId != null) query.addCriteria(Criteria.where("resource").is(new org.bson.types.ObjectId(resourceId)));
        if (status != null) query.addCriteria(Criteria.where("status").is(status));
        if (priority != null) query.addCriteria(Criteria.where("priority").is(priority));
        if (category != null) query.addCriteria(Criteria.where("category").is(category));
        query.with(pageable);

        List<Ticket> tickets = mongoTemplate.find(query, Ticket.class);
        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), Ticket.class);

        Page<Ticket> ticketPage = PageableExecutionUtils.getPage(tickets, pageable, () -> total);

        List<TicketResponse> content = ticketPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<TicketResponse>builder()
                .content(content)
                .page(ticketPage.getNumber())
                .size(ticketPage.getSize())
                .totalElements(ticketPage.getTotalElements())
                .totalPages(ticketPage.getTotalPages())
                .last(ticketPage.isLast())
                .build();
    }

    @Override
    public TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));
        return mapToResponse(ticket);
    }

    @Override
    public TicketResponse updateTicket(String id, TicketRequest request, String userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));

        if (!ticket.getReporter().getId().equals(userId)) {
            throw new UnauthorizedException("You can only update your own tickets");
        }

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("Only tickets with OPEN status can be edited");
        }

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setLocation(request.getLocation());
        ticket.setCategory(request.getCategory());
        ticket.setContactPhone(request.getContactPhone());
        ticket.setContactEmail(request.getContactEmail());

        if (request.getPriority() != null) {
            ticket.setPriority(request.getPriority());
        }

        if (request.getResourceId() != null) {
            Resource resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Resource", "id", request.getResourceId()));
            ticket.setResource(resource);
        } else {
            ticket.setResource(null);
        }

        ticket = ticketRepository.save(ticket);
        return mapToResponse(ticket);
    }

    @Override
    public void deleteTicket(String id, String userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));

        if (!ticket.getReporter().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete your own tickets");
        }

        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new BadRequestException("Only tickets with OPEN status can be deleted");
        }

        List<TicketAttachment> attachments = ticketAttachmentRepository.findByTicketId(id);
        for (TicketAttachment attachment : attachments) {
            fileStorageService.deleteFile(attachment.getFilePath());
        }
        ticketAttachmentRepository.deleteByTicketId(id);
        commentRepository.deleteByTicketId(id);
        ticketRepository.delete(ticket);
    }

    @Override
    public TicketResponse updateTicketStatus(String id, TicketStatusUpdateRequest request, String userId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));

        validateStatusTransition(ticket.getStatus(), request.getStatus());

        ticket.setStatus(request.getStatus());

        if (request.getStatus() == TicketStatus.IN_PROGRESS && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

        if (request.getStatus() == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
            ticket.setResolutionNotes(request.getResolutionNotes());
        }

        if (request.getStatus() == TicketStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("Rejection reason is required when rejecting a ticket");
            }
            ticket.setRejectionReason(request.getRejectionReason());
        }

        ticket = ticketRepository.save(ticket);

        notificationService.sendNotification(
                ticket.getReporter().getId(),
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket Status Updated",
                "Your ticket \"" + ticket.getTitle() + "\" has been updated to " + request.getStatus(),
                "TICKET",
                ticket.getId()
        );

        return mapToResponse(ticket);
    }

    @Override
    public TicketResponse assignTicket(String id, String technicianId, String adminId) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", id));

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", technicianId));

        if (technician.getRole() == null || technician.getRole().getName() != RoleName.TECHNICIAN) {
            throw new BadRequestException("User with id " + technicianId + " is not a technician");
        }

        ticket.setAssignedTo(technician);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            if (ticket.getFirstResponseAt() == null) {
                ticket.setFirstResponseAt(LocalDateTime.now());
            }
        }

        ticket = ticketRepository.save(ticket);

        notificationService.sendNotification(
                technicianId,
                NotificationType.TICKET_ASSIGNED,
                "New Ticket Assigned",
                "You have been assigned to ticket: \"" + ticket.getTitle() + "\"",
                "TICKET",
                ticket.getId()
        );

        notificationService.sendNotification(
                ticket.getReporter().getId(),
                NotificationType.TICKET_ASSIGNED,
                "Ticket Assigned",
                "Your ticket \"" + ticket.getTitle() + "\" has been assigned to " + technician.getName(),
                "TICKET",
                ticket.getId()
        );

        return mapToResponse(ticket);
    }

    @Override
    public AttachmentResponse uploadAttachment(String ticketId, MultipartFile file, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        if (!ticket.getReporter().getId().equals(userId)) {
            throw new UnauthorizedException("You can only upload attachments to your own tickets");
        }

        long currentCount = ticketAttachmentRepository.countByTicketId(ticketId);
        if (currentCount >= MAX_ATTACHMENTS) {
            throw new BadRequestException("Maximum " + MAX_ATTACHMENTS + " attachments allowed per ticket");
        }

        if (!fileStorageService.isValidImageType(file.getContentType())) {
            throw new BadRequestException("Invalid file type. Only image files are allowed");
        }

        String filePath = fileStorageService.storeFile(file);

        TicketAttachment attachment = TicketAttachment.builder()
                .ticketId(ticketId)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        attachment = ticketAttachmentRepository.save(attachment);
        return mapAttachmentToResponse(attachment);
    }

    @Override
    public void deleteAttachment(String ticketId, String attachmentId, String userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        if (!ticket.getReporter().getId().equals(userId)) {
            throw new UnauthorizedException("You can only delete attachments from your own tickets");
        }

        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        if (!attachment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Attachment does not belong to the specified ticket");
        }

        fileStorageService.deleteFile(attachment.getFilePath());
        ticketAttachmentRepository.delete(attachment);
    }

    @Override
    public org.springframework.core.io.Resource downloadAttachment(String ticketId, String attachmentId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));

        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        if (!attachment.getTicketId().equals(ticketId)) {
            throw new BadRequestException("Attachment does not belong to the specified ticket");
        }

        return fileStorageService.loadFile(attachment.getFilePath());
    }

    private void validateStatusTransition(TicketStatus currentStatus, TicketStatus newStatus) {
        boolean valid = switch (currentStatus) {
            case OPEN -> newStatus == TicketStatus.IN_PROGRESS || newStatus == TicketStatus.REJECTED;
            case IN_PROGRESS -> newStatus == TicketStatus.RESOLVED;
            case RESOLVED -> newStatus == TicketStatus.CLOSED;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus);
        }
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        TicketResponse.TicketResponseBuilder builder = TicketResponse.builder()
                .id(ticket.getId())
                .location(ticket.getLocation())
                .category(ticket.getCategory())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .reporter(mapUserToResponse(ticket.getReporter()))
                .contactPhone(ticket.getContactPhone())
                .contactEmail(ticket.getContactEmail())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .resolvedAt(ticket.getResolvedAt())
                .firstResponseAt(ticket.getFirstResponseAt())
                .slaResponseHours(ticket.getFirstResponseAt() != null && ticket.getCreatedAt() != null
                        ? ChronoUnit.HOURS.between(ticket.getCreatedAt(), ticket.getFirstResponseAt()) : null)
                .slaResolutionHours(ticket.getResolvedAt() != null && ticket.getCreatedAt() != null
                        ? ChronoUnit.HOURS.between(ticket.getCreatedAt(), ticket.getResolvedAt()) : null)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt());

        if (ticket.getAssignedTo() != null) {
            builder.assignedTo(mapUserToResponse(ticket.getAssignedTo()));
        }

        if (ticket.getResource() != null) {
            builder.resource(mapResourceToResponse(ticket.getResource()));
        }

        List<TicketAttachment> attachments = ticketAttachmentRepository.findByTicketId(ticket.getId());
        builder.attachments(attachments.stream()
                .map(this::mapAttachmentToResponse)
                .collect(Collectors.toList()));

        List<Comment> comments = commentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
        builder.comments(comments.stream()
                .map(this::mapCommentToResponse)
                .collect(Collectors.toList()));

        return builder.build();
    }

    private AttachmentResponse mapAttachmentToResponse(TicketAttachment attachment) {
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .downloadUrl("/api/v1/tickets/" + attachment.getTicketId()
                        + "/attachments/" + attachment.getId())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    private CommentResponse mapCommentToResponse(Comment comment) {
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

    private ResourceResponse mapResourceToResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .building(resource.getBuilding())
                .floor(resource.getFloor())
                .description(resource.getDescription())
                .availabilityStart(resource.getAvailabilityStart())
                .availabilityEnd(resource.getAvailabilityEnd())
                .status(resource.getStatus())
                .imageUrl(resource.getImageUrl())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
