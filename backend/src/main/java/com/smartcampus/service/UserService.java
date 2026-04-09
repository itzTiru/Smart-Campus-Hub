package com.smartcampus.service;

import com.smartcampus.dto.request.LoginRequest;
import com.smartcampus.dto.request.SignupRequest;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.enums.RoleName;

import java.util.List;

public interface UserService {

    UserResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getUserById(String id);

    UserResponse getUserByEmail(String email);

    UserResponse updateUserProfile(String id, String name);

    UserResponse approveUser(String id);

    List<UserResponse> getAllUsers();

    UserResponse updateUserRole(String userId, RoleName roleName);

    UserResponse toggleUserStatus(String userId);
}
