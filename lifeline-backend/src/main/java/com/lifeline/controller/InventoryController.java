package com.lifeline.controller;

import com.lifeline.model.Inventory;
import com.lifeline.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Inventory>> getAllStock() {
        return ResponseEntity.ok(inventoryService.getAllStock());
    }

    @PostMapping("/add")
    public ResponseEntity<Inventory> addBloodBag(@RequestBody Map<String, String> payload) {
        String bloodType = payload.get("bloodType");
        LocalDate expiryDate = LocalDate.parse(payload.get("expiryDate"));
        return ResponseEntity.ok(inventoryService.addBloodBag(bloodType, expiryDate));
    }

    @PutMapping("/{id}/test")
    public ResponseEntity<Void> updateLabResults(@PathVariable Long id, @RequestBody Map<String, Boolean> results) {
        boolean hiv = results.getOrDefault("hiv", false);
        boolean hep = results.getOrDefault("hep", false);
        boolean malaria = results.getOrDefault("malaria", false);
        
        inventoryService.updateLabResults(id, hiv, hep, malaria);
        return ResponseEntity.ok().build();
    }
}
