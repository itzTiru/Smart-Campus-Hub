package com.smartcampus.service;

import com.smartcampus.dto.request.CommentRequest;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.NotificationResponse;
import com.smartcampus.dto.response.PagedResponse;
import com.smartcampus.entity.*;
import com.smartcampus.entity.enums.*;
import com.smartcampus.exception.UnauthorizedException;
import com.smartcampus.repository.*;
import com.smartcampus.service.impl.CommentServiceImpl;
import com.smartcampus.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationCommentServiceTest {

    // ── Notification Service Tests ────────────────────────────────

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    // ── Comment Service Tests ─────────────────────────────────────

    @Mock private CommentRepository commentRepository;
    @Mock private TicketRepository ticketRepository;
    @Mock private UserRepository userRepository2;
    @Mock private NotificationService notificationServiceMock;

    private User user;
    private User otherUser;
    private Ticket ticket;
    private Comment comment;
    private Notification notification;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id("r1").name(RoleName.USER).build();

        user = User.builder()
                .id("u1").email("user@test.com").name("User One")
                .oauthProviderId("g-1").role(userRole).isActive(true).build();

        otherUser = User.builder()
                .id("u2").email("other@test.com").name("User Two")
                .oauthProviderId("g-2").role(userRole).isActive(true).build();

        ticket = Ticket.builder()
                .id("t1").title("Test ticket").description("desc").location("loc")
                .category(TicketCategory.IT_EQUIPMENT).priority(Priority.MEDIUM)
                .status(TicketStatus.OPEN).reporter(user)
                .build();

        comment = Comment.builder()
                .id("c1").ticketId("t1").user(user).content("Test comment")
                .isEdited(false).build();

        notification = Notification.builder()
                .id("n1").userId("u1").title("Test").message("Test msg")
                .type(NotificationType.BOOKING_APPROVED)
                .referenceType("BOOKING").referenceId("b1").isRead(false)
                .build();
    }

    // ── Notification Tests ────────────────────────────────────────

    @Test
    @DisplayName("Should send notification and push via WebSocket")
    void sendNotification_Success() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        notificationService.sendNotification("u1", NotificationType.BOOKING_APPROVED,
                "Test", "Test msg", "BOOKING", "b1");

        verify(notificationRepository).save(any(Notification.class));
        verify(messagingTemplate).convertAndSendToUser(eq("u1"), eq("/queue/notifications"), any());
    }

    @Test
    @DisplayName("Should get user notifications paginated")
    void getUserNotifications_Success() {
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq("u1"), any(Pageable.class)))
                .thenReturn(page);

        PagedResponse<NotificationResponse> response = notificationService.getUserNotifications("u1", 0, 10);

        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getTitle()).isEqualTo("Test");
    }

    @Test
    @DisplayName("Should mark notification as read")
    void markAsRead_Success() {
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        notificationService.markAsRead("n1", "u1");

        assertThat(notification.getIsRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when marking another's notification")
    void markAsRead_Unauthorized() {
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead("n1", "u99"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should get unread count")
    void getUnreadCount_Success() {
        when(notificationRepository.countByUserIdAndIsReadFalse("u1")).thenReturn(5L);

        long count = notificationService.getUnreadCount("u1");

        assertThat(count).isEqualTo(5);
    }

    @Test
    @DisplayName("Should delete own notification")
    void deleteNotification_Success() {
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("n1", "u1");

        verify(notificationRepository).delete(notification);
    }

    // ── Comment Tests ─────────────────────────────────────────────

    @Test
    @DisplayName("Comment service should add comment and notify ticket reporter")
    void addComment_NotifiesReporter() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(userRepository.findById("u2")).thenReturn(Optional.of(otherUser));
        when(commentRepository.save(any(Comment.class))).thenReturn(
                Comment.builder().id("c2").ticketId("t1").user(otherUser).content("reply").isEdited(false).build()
        );

        CommentResponse response = commentService.addComment("t1",
                CommentRequest.builder().content("reply").build(), "u2");

        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("reply");
        verify(notificationServiceMock).sendNotification(eq("u1"), eq(NotificationType.NEW_COMMENT),
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("Comment service should NOT notify when reporter comments on own ticket")
    void addComment_NoSelfNotification() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(userRepository.findById("u1")).thenReturn(Optional.of(user));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        commentService.addComment("t1", CommentRequest.builder().content("self comment").build(), "u1");

        verify(notificationServiceMock, never()).sendNotification(anyString(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Comment service should allow owner to edit comment")
    void updateComment_OwnerSuccess() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        CommentResponse response = commentService.updateComment("t1", "c1",
                CommentRequest.builder().content("edited").build(), "u1");

        assertThat(comment.getIsEdited()).isTrue();
    }

    @Test
    @DisplayName("Comment service should reject edit from non-owner")
    void updateComment_NonOwner() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.updateComment("t1", "c1",
                CommentRequest.builder().content("hacked").build(), "u99"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Comment service should allow admin to delete any comment")
    void deleteComment_AdminSuccess() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));

        commentService.deleteComment("t1", "c1", "u99", true);

        verify(commentRepository).delete(comment);
    }

    @Test
    @DisplayName("Comment service should reject delete from non-owner non-admin")
    void deleteComment_Unauthorized() {
        CommentServiceImpl commentService = new CommentServiceImpl(
                commentRepository, ticketRepository, userRepository, notificationServiceMock);

        when(ticketRepository.findById("t1")).thenReturn(Optional.of(ticket));
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment("t1", "c1", "u99", false))
                .isInstanceOf(UnauthorizedException.class);
    }
}
