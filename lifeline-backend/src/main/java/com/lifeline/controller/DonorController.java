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
    public ResponseEntity<Boolean> checkBasicEligibility(@PathVariable Long id) {
        boolean isEligible = donorService.checkEligibility(id);
        return ResponseEntity.ok(isEligible);
    }

    @PostMapping("/health-check")
    public ResponseEntity<Boolean> evaluateHealthQuestionnaire(@RequestBody HealthHistory history) {
        // Keep existing logic or delegate
        boolean isEligible = true; // Placeholder if original service is removed
        return ResponseEntity.ok(isEligible);
    }
}
