package com.lifeline.config;

import com.lifeline.model.Camp;
import com.lifeline.model.Donor;
import com.lifeline.model.Inventory;
import com.lifeline.model.User;
import com.lifeline.repository.CampRepository;
import com.lifeline.repository.DonorRepository;
import com.lifeline.repository.InventoryRepository;
import com.lifeline.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CampRepository campRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsersAndDonors();
        }
        if (inventoryRepository.count() == 0) {
            seedInventory();
        }
        if (campRepository.count() == 0) {
            seedCamps();
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

        User hospital = new User();
        hospital.setName("Colombo National Hospital");
        hospital.setEmail("hospital@lifeline.com");
        hospital.setPassword("hospital123");
        hospital.setRole(User.Role.HOSPITAL);
        userRepository.save(hospital);

        User lab = new User();
        lab.setName("Lab Technician");
        lab.setEmail("lab@lifeline.com");
        lab.setPassword("lab123");
        lab.setRole(User.Role.LAB);
        userRepository.save(lab);

        // Donor 1: Eligible
        User user1 = new User(null, "John Doe", "john@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user1);
        Donor donor1 = new Donor(null, user1, "O+", LocalDate.of(2025, 1, 1), 70.0, "Male", LocalDate.of(1990, 5, 15), null, null);
        donorRepository.save(donor1);

        // Donor 2: Ineligible (Recent Donation)
        User user2 = new User(null, "Jane Smith", "jane@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user2);
        Donor donor2 = new Donor(null, user2, "A-", LocalDate.now().minusDays(30), 60.0, "Female", LocalDate.of(1995, 8, 20), null, null);
        donorRepository.save(donor2);

        // Donor 3: New Donor
        User user3 = new User(null, "Bob Brown", "bob@example.com", "pass123", User.Role.DONOR);
        userRepository.save(user3);
        Donor donor3 = new Donor(null, user3, "AB+", null, 80.0, "Male", LocalDate.of(1985, 3, 10), null, null);
        donorRepository.save(donor3);

        System.out.println("Users and Donors seeded.");
    }

    private void seedInventory() {
        // Safe Bags
        inventoryRepository.save(new Inventory(null, "O+", 1, LocalDate.now().plusDays(30), "SAFE", "SAFE", "TESTED_SAFE", null, null, null, null));
        inventoryRepository.save(new Inventory(null, "A+", 1, LocalDate.now().plusDays(25), "SAFE", "SAFE", "TESTED_SAFE", null, null, null, null));
        inventoryRepository.save(new Inventory(null, "B-", 1, LocalDate.now().plusDays(40), "SAFE", "SAFE", "TESTED_SAFE", null, null, null, null));

        // Bio-Hazard Bags
        inventoryRepository.save(new Inventory(null, "AB+", 1, LocalDate.now().plusDays(20), "DISCARD", "BIO-HAZARD", "TESTED_UNSAFE", null, null, null, null));
        inventoryRepository.save(new Inventory(null, "O-", 1, LocalDate.now().plusDays(15), "DISCARD", "BIO-HAZARD", "TESTED_UNSAFE", null, null, null, null));

        // Untested Bags
        inventoryRepository.save(new Inventory(null, "A-", 1, LocalDate.now().plusDays(35), "UNTESTED", null, "PENDING", null, null, null, null));

        System.out.println("Inventory seeded.");
    }

    private void seedCamps() {
        campRepository.save(new Camp(null, "Colombo Camp", "Western", "Colombo", "Colombo City Centre",
                LocalDate.of(2026, 3, 10), LocalTime.of(9, 0), LocalTime.of(13, 0), "Colombo National Hospital", "",
                6.9271, 79.8612, 0));
        campRepository.save(new Camp(null, "Kandy Drive", "Central", "Kandy", "Kandy City Center",
                LocalDate.of(2026, 3, 15), LocalTime.of(10, 30), LocalTime.of(14, 30), "Kandy General Hospital", "",
                7.2906, 80.6337, 0));
        campRepository.save(new Camp(null, "Galle Donation Event", "Southern", "Galle", "Galle Fort",
                LocalDate.of(2026, 3, 20), LocalTime.of(8, 30), LocalTime.of(12, 30), "Galle Teaching Hospital", "",
                6.0535, 80.2210, 0));

        System.out.println("Camps seeded.");
    }
}
