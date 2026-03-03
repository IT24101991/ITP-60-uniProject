package com.example.bloodmanagement.service;




import com.example.bloodmanagement.dto.AdminUpdateUserRequest;
import com.example.bloodmanagement.dto.UpdateProfileRequest;
import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.util.List;


@Service
public class UserService {



    private final PasswordEncoder passwordEncoder;

    private final UserRepository userRepository;

    private final AuthenticationManager authenticationManager;


    public UserService(PasswordEncoder passwordEncoder, UserRepository userRepository, AuthenticationManager authenticationManager) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;

    }


    public List<UserEntity> getAllUsers() {
        return userRepository.findAll();
    }

    /*public UserEntity createUser(UserEntity userData) {
        UserEntity newUser = new UserEntity(userData.getEmail(), userData.getName(), userData.getUsername() , passwordEncoder.encode(userData.getPassword()),userData.getPhoneNumber());
        return userRepository.save(newUser);
    }*/


    // ✅ LOGIN METHOD
    public UserEntity login(String email, String password) {

        UserEntity user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getPassword().equals(password)) {
            return user;
        }

        return null;
    }

    public UserEntity createUser(UserEntity userData) {
        userData.setPassword(
                passwordEncoder.encode(userData.getPassword())
        );
        if (userData.getRole() == null || userData.getRole().isEmpty()) {
            userData.setRole("USER");
        }
        return userRepository.save(userData);
    }


    // USER: update own profile
    public UserEntity updateOwnProfile(String currentEmail, UpdateProfileRequest req) {
        UserEntity user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null) {
            user.setName(req.getName());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            user.setEmail(req.getEmail());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }

        return userRepository.save(user);
    }

    // USER: delete own account
    public void deleteOwnAccount(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
    }

    // ADMIN: update any user
    public UserEntity adminUpdateUser(Long userId, AdminUpdateUserRequest req) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null) {
            user.setName(req.getName());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            user.setEmail(req.getEmail());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRole() != null && !req.getRole().isBlank()) {
            user.setRole(req.getRole());
        }

        return userRepository.save(user);
    }

    // ADMIN: delete any user
    public void adminDeleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(userId);
    }



}
