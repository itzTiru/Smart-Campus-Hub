package com.smartcampus.controller;

import com.smartcampus.dto.request.LoginRequest;
import com.smartcampus.dto.request.SignupRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.RoleName;
import com.smartcampus.repository.RoleRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtTokenProvider;
import com.smartcampus.security.UserPrincipal;
import com.smartcampus.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.smartcampus.repository.TechnicianRepository technicianRepository;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse user = userService.signup(request);
        return ResponseEntity.ok(ApiResponse.success("Account created successfully. Please wait for admin approval", user));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal) {
        UserResponse user = userService.getUserById(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> updates) {
        String name = updates.get("name");
        UserResponse user = userService.updateUserProfile(principal.getUser().getId(), name);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully. Please remove token on client side.", null));
    }

    @PostMapping("/technician-bridge")
    public ResponseEntity<ApiResponse<Map<String, Object>>> technicianBridge(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        if (!user.getRole().getName().name().equals("TECHNICIAN")) {
            throw new RuntimeException("Only TECHNICIAN role users can access the technician portal");
        }

        String email = user.getEmail().trim().toLowerCase();
        com.smartcampus.entity.Technician technician = technicianRepository.findByEmail(email)
                .orElseGet(() -> technicianRepository.save(
                        com.smartcampus.entity.Technician.builder()
                                .username(email.split("@")[0])
                                .passwordHash("")
                                .fullName(user.getName())
                                .email(email)
                                .specialtyCategory(com.smartcampus.entity.enums.TicketCategory.OTHER)
                                .available(true)
                                .isActive(true)
                                .currentActiveJobs(0)
                                .build()
                ));

        String techToken = jwtTokenProvider.generateTechnicianToken(technician);

        return ResponseEntity.ok(ApiResponse.success("Technician bridge successful", Map.of(
                "token", techToken,
                "technician", Map.of(
                        "id", technician.getId(),
                        "username", technician.getUsername(),
                        "fullName", technician.getFullName(),
                        "email", technician.getEmail(),
                        "phone", technician.getPhone() != null ? technician.getPhone() : "",
                        "specialtyCategory", technician.getSpecialtyCategory().name(),
                        "available", technician.getAvailable(),
                        "isActive", technician.getIsActive(),
                        "currentActiveJobs", technician.getCurrentActiveJobs(),
                        "yearsOfExperience", technician.getYearsOfExperience() != null ? technician.getYearsOfExperience() : 0
                )
        )));
    }

}
