package com.example.bloodmanagement.controller;

import com.example.bloodmanagement.dto.UpdateProfileRequest;
import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
public class DonerController {

  private final UserService userService;

    public DonerController(UserService userService) {
        this.userService = userService;
    }


    @GetMapping("/user-dashboard")
    public Map<String, String> userDashboard(Authentication authentication) {
        String username = authentication.getName();
        return Map.of("message", "Welcome to your dashboard, " + username);
    }

    @GetMapping("/profile")
    public Map<String, Object> userProfile(@AuthenticationPrincipal UserDetails user) {
        return Map.of(
                "username", user.getUsername(),
                "roles", user.getAuthorities()
        );
    }

    // USER: update own profile
    @PutMapping("/profile")
    public UserEntity updateProfile(Authentication authentication,
                                    @RequestBody UpdateProfileRequest req) {
        String email = authentication.getName();
        return userService.updateOwnProfile(email, req);
    }

    // USER: delete own account
    @DeleteMapping("/account")
    public void deleteOwnAccount(Authentication authentication) {
        String email = authentication.getName();
        userService.deleteOwnAccount(email);
    }
}
