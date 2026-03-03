package com.example.bloodmanagement.controller;

import com.example.bloodmanagement.dto.AdminUpdateUserRequest;
import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.repository.UserRepository;
import com.example.bloodmanagement.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository repo;
    private final UserService userService;

    public AdminController(UserRepository repo, UserService userService) {
        this.repo = repo;
        this.userService = userService;
    }



    @GetMapping("/admin-dashboard")
    public Map<String, String> adminDashboard(Authentication authentication) {
        String username = authentication.getName();
        return Map.of("message", "Welcome to your dashboard, " + username);
    }

    @GetMapping("/profile")
    public Map<String, Object> adminprofile(@AuthenticationPrincipal UserDetails user) {
        return Map.of(
                "username", user.getUsername(),
                "roles", user.getAuthorities()
        );
    }

    // ADMIN: list all users
    @GetMapping("/admin-users")
    public List<UserEntity> getAllUsers() {
        return repo.findAll();
    }

    // ADMIN: update any user
    @PutMapping("/users/{id}")
    public UserEntity updateUser(@PathVariable Long id,
                                 @RequestBody AdminUpdateUserRequest req) {
        return userService.adminUpdateUser(id, req);
    }

    // ADMIN: delete any user
    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.adminDeleteUser(id);
    }

}
