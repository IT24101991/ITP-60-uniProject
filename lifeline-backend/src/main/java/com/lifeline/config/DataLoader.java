package com.lifeline.config;

import com.lifeline.model.Donor;
import com.lifeline.model.Inventory;
import com.lifeline.model.User;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.InventoryRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsersAndDonors();
        }
        if (inventoryRepository.count() == 0) {
            seedInventory();
        }
    }

    private void seedUsersAndDonors() {
        // Admin User
        User admin = new User();
        admin.setName("Admin Staff");
        admin.setEmail("admin@lifeline.com");
        admin.setPassword("admin123"); // In real app, use BCrypt
        admin.setRole(User.Role.ADMIN);
        userRepository.save(admin);

        // Donor 1: Eligible
        User user1 = new User(null, "John Doe", "john@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user1);
        Donor donor1 = new Donor(null, user1, "O+", LocalDate.of(2025, 1, 1), 70.0, "Male", LocalDate.of(1990, 5, 15));
        donorRepository.save(donor1);

        // Donor 2: Ineligible (Recent Donation)
        User user2 = new User(null, "Jane Smith", "jane@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user2);
        Donor donor2 = new Donor(null, user2, "A-", LocalDate.now().minusDays(30), 60.0, "Female", LocalDate.of(1995, 8, 20));
        donorRepository.save(donor2);

        // Donor 3: New Donor
        User user3 = new User(null, "Bob Brown", "bob@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user3);
        Donor donor3 = new Donor(null, user3, "AB+", null, 80.0, "Male", LocalDate.of(1985, 3, 10));
        donorRepository.save(donor3);

        System.out.println("Users and Donors seeded.");
    }

    private void seedInventory() {
        // Safe Bags
        inventoryRepository.save(new Inventory(null, "O+", 1, LocalDate.now().plusDays(30), "SAFE", "TESTED_SAFE", "SAFE"));
        inventoryRepository.save(new Inventory(null, "A+", 1, LocalDate.now().plusDays(25), "SAFE", "TESTED_SAFE", "SAFE"));
        inventoryRepository.save(new Inventory(null, "B-", 1, LocalDate.now().plusDays(40), "SAFE", "TESTED_SAFE", "SAFE"));

        // Bio-Hazard Bags
        inventoryRepository.save(new Inventory(null, "AB+", 1, LocalDate.now().plusDays(20), "DISCARD", "TESTED_UNSAFE", "BIO-HAZARD"));
        inventoryRepository.save(new Inventory(null, "O-", 1, LocalDate.now().plusDays(15), "DISCARD", "TESTED_UNSAFE", "BIO-HAZARD"));

        // Untested Bags
        inventoryRepository.save(new Inventory(null, "A-", 1, LocalDate.now().plusDays(35), "UNTESTED", "PENDING", null));

        System.out.println("Inventory seeded.");
    }
}
