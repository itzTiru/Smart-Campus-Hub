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

    /**
     * DEV ONLY - Creates a test user and returns a JWT token.
     * Remove this endpoint before production/submission.
     */
    @PostMapping("/dev-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> devLogin(
            @RequestParam(defaultValue = "ADMIN") String role) {
        RoleName roleName = RoleName.valueOf(role.toUpperCase());
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + role));

        String email = "dev-" + role.toLowerCase() + "@smartcampus.test";
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .name("Dev " + role.substring(0, 1).toUpperCase() + role.substring(1).toLowerCase())
                        .oauthProviderId("dev-" + role.toLowerCase())
                        .oauthProvider("dev")
                        .role(userRole)
                        .isActive(true)
                        .isApproved(true)
                        .build()));

        UserPrincipal principal = new UserPrincipal(user, Map.of());
        String token = jwtTokenProvider.generateToken(principal);

        return ResponseEntity.ok(ApiResponse.success("Dev login successful", Map.of(
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", roleName.name()
                )
        )));
    }
}
