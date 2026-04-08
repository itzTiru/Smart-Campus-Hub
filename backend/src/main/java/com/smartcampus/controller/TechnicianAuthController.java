package com.smartcampus.controller;

import com.smartcampus.dto.request.TechnicianLoginRequest;
import com.smartcampus.dto.request.TechnicianRegisterRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.TechnicianResponse;
import com.smartcampus.entity.Technician;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.repository.TechnicianRepository;
import com.smartcampus.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/technicians")
@RequiredArgsConstructor
public class TechnicianAuthController {

    private final TechnicianRepository technicianRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TechnicianResponse>> register(
            @Valid @RequestBody TechnicianRegisterRequest request) {

        if (technicianRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (technicianRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Technician technician = Technician.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .specialtyCategory(request.getSpecialtyCategory())
                .yearsOfExperience(request.getYearsOfExperience())
                .available(true)
                .isActive(true)
                .currentActiveJobs(0)
                .build();

        Technician saved = technicianRepository.save(technician);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Technician registered successfully", mapToResponse(saved)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @Valid @RequestBody TechnicianLoginRequest request) {

        Technician technician = technicianRepository.findByUsername(request.getUsername().trim())
                .orElseThrow(() -> new BadRequestException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), technician.getPasswordHash())) {
            throw new BadRequestException("Invalid username or password");
        }

        if (!Boolean.TRUE.equals(technician.getIsActive())) {
            throw new BadRequestException("Technician account is inactive");
        }

        String token = jwtTokenProvider.generateTechnicianToken(technician);

        return ResponseEntity.ok(ApiResponse.success("Technician login successful", Map.of(
                "token", token,
                "technician", mapToResponse(technician)
        )));
    }

    private TechnicianResponse mapToResponse(Technician technician) {
        return TechnicianResponse.builder()
                .id(technician.getId())
                .username(technician.getUsername())
                .fullName(technician.getFullName())
                .email(technician.getEmail())
                .phone(technician.getPhone())
                .specialtyCategory(technician.getSpecialtyCategory())
                .available(technician.getAvailable())
                .isActive(technician.getIsActive())
                .currentActiveJobs(technician.getCurrentActiveJobs())
                .yearsOfExperience(technician.getYearsOfExperience())
                .createdAt(technician.getCreatedAt())
                .build();
    }
}
