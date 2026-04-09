package com.smartcampus.config;

import com.smartcampus.entity.*;
import com.smartcampus.entity.enums.*;
import com.smartcampus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public void run(String... args) {
        // Seed roles
        for (RoleName roleName : RoleName.values()) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(roleName.name() + " role")
                        .build());
                log.info("Created role: {}", roleName);
            }
        }

        // Only seed data if DB is empty (no users besides dev accounts)
        if (userRepository.count() > 3) {
            log.info("Data already seeded, skipping.");
            return;
        }

        log.info("Seeding realistic campus data...");

        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseThrow();
        Role userRole = roleRepository.findByName(RoleName.USER).orElseThrow();
        Role techRole = roleRepository.findByName(RoleName.TECHNICIAN).orElseThrow();
        Role mgrRole = roleRepository.findByName(RoleName.MANAGER).orElseThrow();

        // ── Users (realistic SLIIT students/staff) ──────────────────────
        User admin = saveUser("prof.kamal@sliit.lk", "Prof. Kamal Perera", "sliit-001", adminRole);
        User tech1 = saveUser("nimal.silva@sliit.lk", "Nimal Silva", "sliit-002", techRole);
        User tech2 = saveUser("suresh.fernando@sliit.lk", "Suresh Fernando", "sliit-003", techRole);
        User mgr = saveUser("dr.jayasinghe@sliit.lk", "Dr. Anura Jayasinghe", "sliit-004", mgrRole);
        User student1 = saveUser("it21045632@my.sliit.lk", "Tharindu Wickramasinghe", "sliit-101", userRole);
        User student2 = saveUser("it21098456@my.sliit.lk", "Nethmi Dissanayake", "sliit-102", userRole);
        User student3 = saveUser("it21034789@my.sliit.lk", "Kavindu Rajapaksha", "sliit-103", userRole);
        User student4 = saveUser("it21067234@my.sliit.lk", "Ishara Madushani", "sliit-104", userRole);
        User student5 = saveUser("it21089012@my.sliit.lk", "Chamara Bandara", "sliit-105", userRole);
        User lecturer1 = saveUser("ms.wijeratne@sliit.lk", "Ms. Dilini Wijeratne", "sliit-006", userRole);

        // ── Resources (actual SLIIT-like campus facilities) ─────────────
        Resource lh1 = saveResource("Main Auditorium", ResourceType.LECTURE_HALL, 500,
                "Main Building, Ground Floor", "Main Building", "G",
                "Large auditorium with surround sound, projector screens, and stage lighting",
                LocalTime.of(8, 0), LocalTime.of(20, 0), 1.0, 4.0);

        Resource lh2 = saveResource("Lecture Hall A-401", ResourceType.LECTURE_HALL, 200,
                "Block A, 4th Floor", "Block A", "4",
                "Tiered seating lecture hall with dual projectors and wireless mic system",
                LocalTime.of(8, 0), LocalTime.of(18, 0), 1.0, 4.0);

        Resource lh3 = saveResource("Lecture Hall B-201", ResourceType.LECTURE_HALL, 150,
                "Block B, 2nd Floor", "Block B", "2",
                "Standard lecture hall with whiteboard and single projector",
                LocalTime.of(8, 0), LocalTime.of(18, 0), 1.0, 4.0);

        Resource lab1 = saveResource("Software Engineering Lab", ResourceType.LAB, 60,
                "Block C, 3rd Floor", "Block C", "3",
                "60 workstations with i7 processors, 16GB RAM, dual monitors. IntelliJ, VS Code, Docker pre-installed",
                LocalTime.of(8, 0), LocalTime.of(21, 0), 1.0, 3.0);

        Resource lab2 = saveResource("Network & Security Lab", ResourceType.LAB, 40,
                "Block C, 4th Floor", "Block C", "4",
                "Cisco networking equipment, packet tracer stations, isolated VLAN segments for penetration testing labs",
                LocalTime.of(8, 0), LocalTime.of(18, 0), 1.0, 3.0);

        Resource lab3 = saveResource("Data Science Lab", ResourceType.LAB, 45,
                "Block D, 2nd Floor", "Block D", "2",
                "GPU workstations (RTX 4070), Jupyter Hub server, TensorFlow and PyTorch environments",
                LocalTime.of(8, 0), LocalTime.of(20, 0), 1.0, 3.0);

        Resource lab4 = saveResource("Electronics & IoT Lab", ResourceType.LAB, 30,
                "Block D, 3rd Floor", "Block D", "3",
                "Arduino, Raspberry Pi kits, oscilloscopes, soldering stations, 3D printer",
                LocalTime.of(8, 0), LocalTime.of(17, 0), 1.0, 3.0);

        Resource mr1 = saveResource("Board Room - 5th Floor", ResourceType.MEETING_ROOM, 20,
                "Main Building, 5th Floor", "Main Building", "5",
                "Executive board room with video conferencing (Zoom Rooms), 75-inch display, espresso machine",
                LocalTime.of(8, 0), LocalTime.of(18, 0), 0.5, 2.0);

        Resource mr2 = saveResource("Discussion Room A-102", ResourceType.MEETING_ROOM, 8,
                "Block A, 1st Floor", "Block A", "1",
                "Small group discussion room with whiteboard wall and TV screen for presentations",
                LocalTime.of(8, 0), LocalTime.of(20, 0), 0.5, 2.0);

        Resource mr3 = saveResource("Collaboration Space B-105", ResourceType.MEETING_ROOM, 12,
                "Block B, 1st Floor", "Block B", "1",
                "Open collaboration space with movable furniture, large whiteboard, and power outlets at every seat",
                LocalTime.of(7, 0), LocalTime.of(22, 0), 0.5, 2.0);

        Resource proj1 = saveResource("Epson EB-2265U Projector", ResourceType.PROJECTOR, null,
                "IT Equipment Store, Block A", "Block A", "G",
                "5500 lumens, WUXGA resolution, wireless projection capable. Comes with carrying case and remote",
                LocalTime.of(8, 0), LocalTime.of(17, 0), 1.0, 8.0);

        Resource proj2 = saveResource("BenQ MH733 Portable Projector", ResourceType.PROJECTOR, null,
                "IT Equipment Store, Block A", "Block A", "G",
                "4000 lumens, Full HD, compact portable projector for classroom use",
                LocalTime.of(8, 0), LocalTime.of(17, 0), 1.0, 8.0);

        Resource cam1 = saveResource("Sony A7 III Camera Kit", ResourceType.CAMERA, null,
                "Media Room, Main Building", "Main Building", "2",
                "Full-frame mirrorless camera with 28-70mm lens, tripod, and lighting kit. For event coverage and project videos",
                LocalTime.of(9, 0), LocalTime.of(17, 0), 1.0, 8.0);

        Resource cam2 = saveResource("Canon EOS R50 Vlogging Kit", ResourceType.CAMERA, null,
                "Media Room, Main Building", "Main Building", "2",
                "Compact mirrorless with 18-45mm lens, Rode wireless mic, and mini tripod",
                LocalTime.of(9, 0), LocalTime.of(17, 0), 1.0, 8.0);

        Resource eq1 = saveResource("PA System - Portable", ResourceType.EQUIPMENT_OTHER, null,
                "Student Center, Ground Floor", "Student Center", "G",
                "JBL portable PA system with 2 wireless mics, Bluetooth connectivity. 8-hour battery",
                LocalTime.of(8, 0), LocalTime.of(20, 0), 1.0, 8.0);

        // Set one resource as OUT_OF_SERVICE
        lab4.setStatus(ResourceStatus.OUT_OF_SERVICE);
        resourceRepository.save(lab4);

        // ── Bookings (mix of statuses, realistic purposes) ──────────────
        LocalDateTime now = LocalDateTime.now();

        // Approved bookings (past and upcoming)
        Booking b1 = saveBooking(lh1, student1, now.plusDays(2).withHour(9).withMinute(0),
                now.plusDays(2).withHour(12).withMinute(0),
                "PAF Group Project Presentation - Smart Campus Hub demo for IT3030",
                35, BookingStatus.APPROVED, admin, "Approved. Projector will be set up by 8:45 AM");

        Booking b2 = saveBooking(lab1, student2, now.plusDays(1).withHour(14).withMinute(0),
                now.plusDays(1).withHour(17).withMinute(0),
                "Database Systems practical session - MongoDB aggregation pipeline practice",
                55, BookingStatus.APPROVED, admin, null);

        Booking b3 = saveBooking(mr1, mgr, now.plusDays(3).withHour(10).withMinute(0),
                now.plusDays(3).withHour(11).withMinute(30),
                "Faculty meeting - Semester 1 exam schedule finalization",
                15, BookingStatus.APPROVED, admin, "Board room reserved with video conferencing for remote faculty");

        Booking b4 = saveBooking(mr2, student3, now.plusDays(1).withHour(16).withMinute(0),
                now.plusDays(1).withHour(18).withMinute(0),
                "SDGP Group 12 sprint planning meeting",
                6, BookingStatus.APPROVED, admin, null);

        // Pending bookings
        Booking b5 = saveBooking(lh2, lecturer1, now.plusDays(5).withHour(8).withMinute(0),
                now.plusDays(5).withHour(10).withMinute(0),
                "Guest lecture on Cloud Architecture by AWS Solutions Architect",
                180, BookingStatus.PENDING, null, null);

        Booking b6 = saveBooking(lab3, student4, now.plusDays(4).withHour(13).withMinute(0),
                now.plusDays(4).withHour(16).withMinute(0),
                "Machine Learning model training session - Final year project (Sentiment Analysis)",
                20, BookingStatus.PENDING, null, null);

        Booking b7 = saveBooking(cam1, student5, now.plusDays(2).withHour(10).withMinute(0),
                now.plusDays(2).withHour(15).withMinute(0),
                "SLIIT Hackathon 2026 event photography and video coverage",
                null, BookingStatus.PENDING, null, null);

        Booking b8 = saveBooking(eq1, student1, now.plusDays(6).withHour(17).withMinute(0),
                now.plusDays(6).withHour(21).withMinute(0),
                "IEEE Student Branch - Tech Talk evening event with panel discussion",
                null, BookingStatus.PENDING, null, null);

        // Rejected booking
        Booking b9 = saveBooking(lh1, student3, now.plusDays(2).withHour(9).withMinute(0),
                now.plusDays(2).withHour(11).withMinute(0),
                "Club event rehearsal",
                50, BookingStatus.REJECTED, admin,
                "Time slot conflicts with approved PAF presentation. Please try Block B lecture hall instead");

        // Cancelled booking
        Booking b10 = saveBooking(lab2, student2, now.plusDays(1).withHour(9).withMinute(0),
                now.plusDays(1).withHour(12).withMinute(0),
                "Network lab practice - cancelled due to schedule change",
                30, BookingStatus.CANCELLED, null, null);

        // ── Tickets (realistic maintenance/IT issues) ───────────────────
        Ticket t1 = saveTicket("Projector not displaying in LH A-401", "The ceiling-mounted projector in Lecture Hall A-401 shows a blue screen but doesn't detect the HDMI input from the podium PC. Tried multiple cables. Started happening after the power outage last Friday.",
                "Block A, 4th Floor - Lecture Hall A-401", TicketCategory.IT_EQUIPMENT, Priority.HIGH,
                TicketStatus.IN_PROGRESS, student1, lh2, tech1);

        Ticket t2 = saveTicket("Water leak in Network Lab ceiling", "There's a slow water leak from the ceiling near workstation row 3 in the Network Lab. Dripping onto the cable trays. Noticed water stains spreading over the past 2 days. Getting worse when it rains.",
                "Block C, 4th Floor - Network & Security Lab", TicketCategory.PLUMBING, Priority.CRITICAL,
                TicketStatus.OPEN, student3, lab2, null);

        Ticket t3 = saveTicket("AC not working in Data Science Lab", "The air conditioning unit in the Data Science Lab has stopped cooling. Room temperature is around 32°C which is causing the GPU workstations to throttle. Students can't run training jobs effectively.",
                "Block D, 2nd Floor - Data Science Lab", TicketCategory.HVAC, Priority.HIGH,
                TicketStatus.IN_PROGRESS, lecturer1, lab3, tech2);

        Ticket t4 = saveTicket("Broken chair in Discussion Room A-102", "Two swivel chairs in Discussion Room A-102 have broken wheel casters. They're unstable and a tripping hazard. One also has a broken armrest.",
                "Block A, 1st Floor - Discussion Room A-102", TicketCategory.FURNITURE, Priority.LOW,
                TicketStatus.OPEN, student4, mr2, null);

        Ticket t5 = saveTicket("Power outlets not working - Collab Space B-105", "The power outlet strip on the east wall (6 outlets) in the Collaboration Space is completely dead. Students can't charge laptops. The west wall outlets still work.",
                "Block B, 1st Floor - Collaboration Space B-105", TicketCategory.ELECTRICAL, Priority.MEDIUM,
                TicketStatus.RESOLVED, student2, mr3, tech1);
        t5.setResolutionNotes("Replaced the faulty power strip and checked the circuit breaker. The breaker had tripped due to overload. Added a surge protector to prevent recurrence.");
        t5.setResolvedAt(now.minusDays(1));
        ticketRepository.save(t5);

        Ticket t6 = saveTicket("Fire extinguisher expired - SE Lab", "The fire extinguisher mounted near the entrance of the Software Engineering Lab has an expired inspection tag (last inspected Dec 2024). Needs replacement or re-inspection.",
                "Block C, 3rd Floor - Software Engineering Lab", TicketCategory.SAFETY, Priority.HIGH,
                TicketStatus.CLOSED, mgr, lab1, tech2);
        t6.setResolutionNotes("Fire extinguisher replaced with newly inspected unit. Updated inspection log. Next inspection due Dec 2026.");
        t6.setResolvedAt(now.minusDays(3));
        ticketRepository.save(t6);

        Ticket t7 = saveTicket("Smartboard pen not responding in LH B-201", "The interactive smartboard pen in Lecture Hall B-201 is not responding to touch. The board displays fine but none of the pens (tried all 3 colors) register input. Board firmware might need updating.",
                "Block B, 2nd Floor - Lecture Hall B-201", TicketCategory.IT_EQUIPMENT, Priority.MEDIUM,
                TicketStatus.OPEN, lecturer1, lh3, null);

        Ticket t8 = saveTicket("Flickering lights in main corridor Block D", "The fluorescent lights in the 3rd floor corridor of Block D are flickering intermittently. Affecting approximately 4-5 light fixtures between rooms D-301 and D-310. Gets worse in the evening.",
                "Block D, 3rd Floor Corridor", TicketCategory.ELECTRICAL, Priority.LOW,
                TicketStatus.IN_PROGRESS, student5, null, tech1);

        // ── Comments on tickets ─────────────────────────────────────────
        saveComment(t1.getId(), tech1, "Checked the HDMI ports - the podium HDMI-out port seems to have a bent pin. Ordered a replacement. Will install tomorrow morning before 8 AM lectures.");
        saveComment(t1.getId(), student1, "Thanks! The morning lecture is at 9 AM so that works. Is there a temporary workaround?");
        saveComment(t1.getId(), tech1, "I've placed a portable projector in the hall for today. It's connected via the VGA backup port.");

        saveComment(t2.getId(), student3, "The leak got worse during today's afternoon rain. Water is now dripping directly onto the cable management tray near Row 3. Placed a bucket there temporarily.");
        saveComment(t2.getId(), mgr, "This is urgent. @Nimal please coordinate with the building maintenance contractor. We need to prevent any damage to the networking equipment.");

        saveComment(t3.getId(), tech2, "Diagnosed the issue - compressor is failing. Contacted the AC vendor (Daikin) for warranty repair. They'll send a technician on Thursday.");
        saveComment(t3.getId(), lecturer1, "Can we get portable fans in the meantime? Students have a deep learning assignment due next week and need the GPU machines.");
        saveComment(t3.getId(), tech2, "I've arranged 3 portable fans from the Student Center. Will set them up tomorrow morning.");

        saveComment(t5.getId(), tech1, "Found the issue. The power strip was overloaded - someone connected a portable heater which drew too much current. Replaced with a commercial-grade strip rated for higher load.");
        saveComment(t5.getId(), student2, "Working perfectly now, thank you!");

        // ── Notifications ───────────────────────────────────────────────
        saveNotification(student1.getId(), "Booking Approved", "Your booking for Main Auditorium on " + now.plusDays(2).toLocalDate() + " has been approved.",
                NotificationType.BOOKING_APPROVED, "BOOKING", b1.getId());
        saveNotification(student2.getId(), "Booking Approved", "Your booking for Software Engineering Lab has been approved.",
                NotificationType.BOOKING_APPROVED, "BOOKING", b2.getId());
        saveNotification(student3.getId(), "Booking Rejected", "Your booking for Main Auditorium was rejected. Reason: Time slot conflicts with approved PAF presentation.",
                NotificationType.BOOKING_REJECTED, "BOOKING", b9.getId());
        saveNotification(student1.getId(), "Ticket Update", "Your ticket \"Projector not displaying in LH A-401\" has been assigned to Nimal Silva.",
                NotificationType.TICKET_ASSIGNED, "TICKET", t1.getId());
        saveNotification(student1.getId(), "New Comment", "Nimal Silva commented on your ticket: \"Checked the HDMI ports - the podium HDMI-out port seems to have a bent pin.\"",
                NotificationType.NEW_COMMENT, "TICKET", t1.getId());
        saveNotification(tech1.getId(), "Ticket Assigned", "You have been assigned to ticket: \"Projector not displaying in LH A-401\"",
                NotificationType.TICKET_ASSIGNED, "TICKET", t1.getId());
        saveNotification(tech2.getId(), "Ticket Assigned", "You have been assigned to ticket: \"AC not working in Data Science Lab\"",
                NotificationType.TICKET_ASSIGNED, "TICKET", t3.getId());
        saveNotification(student2.getId(), "Ticket Resolved", "Your ticket \"Power outlets not working - Collab Space B-105\" has been resolved.",
                NotificationType.TICKET_STATUS_CHANGED, "TICKET", t5.getId());

        log.info("Seed data complete: {} users, {} resources, {} bookings, {} tickets",
                userRepository.count(), resourceRepository.count(), bookingRepository.count(), ticketRepository.count());
    }

    // ── Helper methods ──────────────────────────────────────────────────

    private User saveUser(String email, String name, String providerId, Role role) {
        return userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .email(email).name(name)
                        .oauthProviderId(providerId).oauthProvider("google")
                        .role(role).isActive(true).isApproved(true).build()));
    }

    private Resource saveResource(String name, ResourceType type, Integer capacity,
                                   String location, String building, String floor,
                                   String description, LocalTime start, LocalTime end,
                                   Double minBookingHours, Double maxBookingHours) {
        return resourceRepository.save(Resource.builder()
                .name(name).type(type).capacity(capacity)
                .location(location).building(building).floor(floor)
                .description(description)
                .availabilityStart(start).availabilityEnd(end)
                .minBookingHours(minBookingHours).maxBookingHours(maxBookingHours)
                .status(ResourceStatus.ACTIVE).build());
    }

    private Booking saveBooking(Resource resource, User user,
                                 LocalDateTime start, LocalDateTime end,
                                 String purpose, Integer attendees,
                                 BookingStatus status, User reviewedBy, String remarks) {
        Booking booking = Booking.builder()
                .resource(resource).user(user)
                .startTime(start).endTime(end)
                .purpose(purpose).expectedAttendees(attendees)
                .status(status).build();
        if (reviewedBy != null) {
            booking.setReviewedBy(reviewedBy);
            booking.setReviewedAt(LocalDateTime.now().minusHours(2));
            booking.setAdminRemarks(remarks);
        }
        return bookingRepository.save(booking);
    }

    private Ticket saveTicket(String title, String description, String location,
                               TicketCategory category, Priority priority,
                               TicketStatus status, User reporter, Resource resource, User assignedTo) {
        Ticket ticket = Ticket.builder()
                .title(title).description(description).location(location)
                .category(category).priority(priority).status(status)
                .reporter(reporter).resource(resource).assignedTo(assignedTo)
                .contactEmail(reporter.getEmail())
                .build();
        return ticketRepository.save(ticket);
    }

    private void saveComment(String ticketId, User user, String content) {
        commentRepository.save(Comment.builder()
                .ticketId(ticketId).user(user).content(content).build());
    }

    private void saveNotification(String userId, String title, String message,
                                   NotificationType type, String refType, String refId) {
        notificationRepository.save(Notification.builder()
                .userId(userId).title(title).message(message)
                .type(type).referenceType(refType).referenceId(refId).build());
    }
}
