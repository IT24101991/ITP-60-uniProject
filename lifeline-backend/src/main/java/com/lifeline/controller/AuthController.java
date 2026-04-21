package com.lifeline.controller;

import com.lifeline.model.Donor;
import com.lifeline.model.User;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DonorRepository donorRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email and password are required"));
        }

        return userRepository.findByEmail(email)
                .filter(user -> user.getPassword().equals(password))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of(
                        "role", user.getRole().name(),
                        "userId", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail()
                )))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String fullName = payload.get("fullName");
        String email = payload.get("email");
        String password = payload.get("password");
        String bloodType = payload.get("bloodType");

        if (fullName == null || fullName.isBlank() ||
                email == null || email.isBlank() ||
                password == null || password.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Name, email, and password are required"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered"));
        }

        User user = new User();
        user.setName(fullName.trim());
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(password);
        user.setRole(User.Role.DONOR);
        User savedUser = userRepository.save(user);

        Donor donor = new Donor();
        donor.setUser(savedUser);
        donor.setBloodType((bloodType != null && !bloodType.isBlank()) ? bloodType.trim() : "UNKNOWN");
        donor.setSafetyStatus("SAFE");
        donorRepository.save(donor);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "role", savedUser.getRole().name(),
                "userId", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail()
        ));
    }
}
