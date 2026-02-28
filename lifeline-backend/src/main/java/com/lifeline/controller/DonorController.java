package com.lifeline.controller;

import com.lifeline.model.HealthHistory;
import com.lifeline.service.EligibilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/donors")
public class DonorController {

    @Autowired
    private com.lifeline.service.DonorService donorService;

    @GetMapping("/{id}/eligibility")
    public ResponseEntity<?> checkBasicEligibility(@PathVariable Long id) {
        return ResponseEntity.ok(donorService.getEligibilityDetails(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<com.lifeline.model.Donor> getDonorByUserId(@PathVariable Long userId) {
        return donorService.getDonorByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/health-check")
    public ResponseEntity<Boolean> evaluateHealthQuestionnaire(@RequestBody HealthHistory history) {
        // Keep existing logic or delegate
        boolean isEligible = true; // Placeholder if original service is removed
        return ResponseEntity.ok(isEligible);
    }
}
