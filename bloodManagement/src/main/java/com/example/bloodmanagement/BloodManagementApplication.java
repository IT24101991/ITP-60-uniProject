package com.example.bloodmanagement;

import com.example.bloodmanagement.entity.UserEntity;
import com.example.bloodmanagement.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BloodManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(BloodManagementApplication.class, args);
    }


    @Bean
    CommandLineRunner init(UserRepository repo, PasswordEncoder passwordEncoder) {
        return args -> {
            if (repo.findByEmail("admin@gmail.com").isEmpty()) {
                UserEntity admin = new UserEntity();
                admin.setName("Admin");
                admin.setEmail("admin@gmail.com");
                // Encode the password before saving
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                repo.save(admin);
            }
        };
    }
}
