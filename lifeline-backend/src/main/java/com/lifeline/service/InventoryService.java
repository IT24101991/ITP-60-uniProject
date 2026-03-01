package com.lifeline.service;

import com.lifeline.model.Inventory;
import com.lifeline.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    public Inventory addBloodBag(Inventory bag) {
        return inventoryRepository.save(bag);
    }

    public Inventory addBloodBag(String bloodType, LocalDate expiryDate) {
        Inventory bag = new Inventory();
        bag.setBloodType(bloodType);
        bag.setExpiryDate(expiryDate);
        bag.setStatus("UNTESTED");
        bag.setTestStatus("PENDING");
        bag.setQuantity(1); // Default
        return inventoryRepository.save(bag);
    }

    public void updateLabResults(Long bagId, boolean hivPos, boolean hepPos, boolean malariaPos) {
        Inventory bag = inventoryRepository.findById(bagId)
                .orElseThrow(() -> new RuntimeException("Blood bag not found"));

        if (hivPos || hepPos || malariaPos) {
            bag.setSafetyFlag("BIO-HAZARD");
            bag.setStatus("DISCARD");
            bag.setTestStatus("TESTED_UNSAFE");
        } else {
            bag.setSafetyFlag("SAFE");
            bag.setStatus("AVAILABLE");
            bag.setTestStatus("TESTED_SAFE");
        }
        inventoryRepository.save(bag);
    }

    @Scheduled(cron = "0 0 0 * * ?") // Runs daily at midnight
    @Transactional
    public void checkExpiry() {
        List<Inventory> allInventory = inventoryRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Inventory item : allInventory) {
            if (item.getExpiryDate() != null && item.getExpiryDate().isBefore(today)) {
                if (!"EXPIRED".equals(item.getStatus())) {
                    item.setStatus("EXPIRED");
                    inventoryRepository.save(item);
                }
            }
        }
    }

    public List<Inventory> getAllStock() {
        return inventoryRepository.findAll();
    }
}
