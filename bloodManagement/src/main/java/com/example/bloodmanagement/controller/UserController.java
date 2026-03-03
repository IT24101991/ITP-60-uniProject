package com.example.bloodmanagement.controller;




import com.example.bloodmanagement.dto.RegisterRequest;
import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.repository.UserRepository;

import com.example.bloodmanagement.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class UserController {

    private final UserRepository repository;

    private final UserService userService;
    private final AuthenticationManager authManager;

    public UserController(UserRepository repository, UserService userService, AuthenticationManager authManager) {
        this.repository = repository;

        this.userService = userService;
        this.authManager = authManager;
    }

    @PostMapping("/register")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request) {

        // Basic field validation
        if (request.getName() == null || request.getName().trim().isEmpty() ||
                request.getEmail() == null || request.getEmail().trim().isEmpty() ||
                request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("All fields are required!");
        }

        //  Eligibility check
        if (!request.isEligible()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not eligible to register based on your answers.");
        }

        //  Check if email already exists
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Email is already in use!");
        }

        //  Map DTO to entity
        UserEntity user = new UserEntity();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // remember to encode in service
        user.setRole("USER");

        // Create user
        UserEntity createdUser = userService.createUser(user);
        return ResponseEntity.ok(createdUser);
    }



    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserEntity request,
                                   HttpServletRequest httpRequest) {

        // perform authentication and store in security context
        Authentication authentication = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // ensure session is created so that JSESSIONID cookie is sent
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext());

        UserEntity user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public UserEntity getCurrentUser(Authentication auth) {
        return repository.findByEmail(auth.getName()).orElse(null);
    }




}


