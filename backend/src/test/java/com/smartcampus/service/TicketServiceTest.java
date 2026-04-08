package com.smartcampus.service;

import com.smartcampus.dto.request.TicketRequest;
import com.smartcampus.dto.request.TicketStatusUpdateRequest;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.*;
import com.smartcampus.entity.enums.*;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.*;
import com.smartcampus.service.impl.TicketServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private TicketAttachmentRepository ticketAttachmentRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private NotificationService notificationService;
    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks
    private TicketServiceImpl ticketService;

    private User reporter;
    private User technician;
    private Ticket ticket;
    private Role userRole;
    private Role techRole;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id("r1").name(RoleName.USER).build();
        techRole = Role.builder().id("r3").name(RoleName.TECHNICIAN).build();

        reporter = User.builder()
                .id("u1").email("reporter@test.com").name("Reporter")
                .oauthProviderId("g-1").role(userRole).isActive(true).build();

        technician = User.builder()
                .id("u2").email("tech@test.com").name("Technician")
                .oauthProviderId("g-2").role(techRole).isActive(true).build();

        ticket = Ticket.builder()
                .id("t1").title("Projector broken").description("Not turning on")
                .location("Lab 3, Block B").category(TicketCategory.IT_EQUIPMENT)
                .priority(Priority.HIGH).status(TicketStatus.OPEN)
                .reporter(reporter)
                .build();
    }

    @Test
    @DisplayName("Should create ticket without attachments")
    void createTicket_NoAttachments() {
        TicketRequest request = TicketRequest.builder()
                .title("Projector broken").description("Not turning on")
                .location("Lab 3").category(TicketCategory.IT_EQUIPMENT)
                .priority(Priority.HIGH).build();

        when(userRepository.findById("u1")).thenReturn(Optional.of(reporter));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc("t1")).thenReturn(Collections.emptyList());

        TicketResponse response = ticketService.createTicket(request, null, "u1");

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Projector broken");
        assertThat(response.getStatus()).isEqualTo(TicketStatus.OPEN);
    }

    @Test
    @DisplayName("Should get ticket by ID")
    void getTicketById_Success() {
        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc("t1")).thenReturn(Collections.emptyList());

        TicketResponse response = ticketService.getTicketById("t1");

        assertThat(response.getId()).isEqualTo("t1");
        assertThat(response.getTitle()).isEqualTo("Projector broken");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for invalid ticket ID")
    void getTicketById_NotFound() {
        when(ticketRepository.findById("t99")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ticketService.getTicketById("t99"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Should update own ticket when status is OPEN")
    void updateTicket_Success() {
        TicketRequest updateReq = TicketRequest.builder()
                .title("Updated title").description("Updated desc")
                .location("Lab 4").category(TicketCategory.ELECTRICAL)
                .build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc("t1")).thenReturn(Collections.emptyList());

        TicketResponse response = ticketService.updateTicket("t1", updateReq, "u1");

        assertThat(response).isNotNull();
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when updating another's ticket")
    void updateTicket_Unauthorized() {
        TicketRequest updateReq = TicketRequest.builder()
                .title("Hacked").description("x").location("x")
                .category(TicketCategory.OTHER).build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateTicket("t1", updateReq, "u99"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should not update ticket that is not OPEN")
    void updateTicket_NotOpen() {
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        TicketRequest updateReq = TicketRequest.builder()
                .title("x").description("x").location("x")
                .category(TicketCategory.OTHER).build();

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateTicket("t1", updateReq, "u1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("OPEN");
    }

    @Test
    @DisplayName("Should transition status from OPEN to IN_PROGRESS")
    void updateStatus_OpenToInProgress() {
        TicketStatusUpdateRequest statusReq = new TicketStatusUpdateRequest();
        statusReq.setStatus(TicketStatus.IN_PROGRESS);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc("t1")).thenReturn(Collections.emptyList());

        ticketService.updateTicketStatus("t1", statusReq, "u2");

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        verify(notificationService).sendNotification(eq("u1"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject invalid status transition OPEN to CLOSED")
    void updateStatus_InvalidTransition() {
        TicketStatusUpdateRequest statusReq = new TicketStatusUpdateRequest();
        statusReq.setStatus(TicketStatus.CLOSED);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.updateTicketStatus("t1", statusReq, "u2"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    @DisplayName("Should assign technician to ticket")
    void assignTicket_Success() {
        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(userRepository.findById("u2")).thenReturn(Optional.of(technician));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());
        when(commentRepository.findByTicketIdOrderByCreatedAtAsc("t1")).thenReturn(Collections.emptyList());

        ticketService.assignTicket("t1", "u2", "u99");

        assertThat(ticket.getAssignedTo()).isEqualTo(technician);
        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        verify(notificationService, times(2)).sendNotification(anyString(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should delete own ticket when OPEN")
    void deleteTicket_Success() {
        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(ticketAttachmentRepository.findByTicketId("t1")).thenReturn(Collections.emptyList());

        ticketService.deleteTicket("t1", "u1");

        verify(ticketRepository).delete(ticket);
    }

    @Test
    @DisplayName("Should not delete another user's ticket")
    void deleteTicket_Unauthorized() {
        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteTicket("t1", "u99"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should not delete ticket that is not OPEN")
    void deleteTicket_NotOpen() {
        ticket.setStatus(TicketStatus.RESOLVED);
        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> ticketService.deleteTicket("t1", "u1"))
                .isInstanceOf(BadRequestException.class);
    }
}
