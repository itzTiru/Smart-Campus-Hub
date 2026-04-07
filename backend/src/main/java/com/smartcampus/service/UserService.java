package com.smartcampus.service;

import com.smartcampus.dto.response.UserResponse;
import com.smartcampus.entity.enums.RoleName;

import java.util.List;

public interface UserService {

    UserResponse getUserById(String id);

    UserResponse getUserByEmail(String email);

    UserResponse updateUserProfile(String id, String name);

    List<UserResponse> getAllUsers();

    UserResponse updateUserRole(String userId, RoleName roleName);

    UserResponse toggleUserStatus(String userId);
}
