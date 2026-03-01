package com.lifeline.controller;

import com.lifeline.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyController {

    @Autowired
    private ActivityService activityService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestEmergencyBlood(@RequestBody Map<String, Object> payload) {
        String bloodType = (String) payload.getOrDefault("bloodType", "Unknown");
        Integer units = payload.get("units") != null ? Integer.parseInt(payload.get("units").toString()) : 1;
        String hospital = (String) payload.getOrDefault("hospital", "Unknown Hospital");
        String urgency = (String) payload.getOrDefault("urgency", "CRITICAL");
        
        // Log the activity
        String activityDesc = String.format("Emergency Alert: %d units of %s needed at %s (%s)", 
            units, bloodType, hospital, urgency);
        activityService.logActivity(activityDesc, "EMERGENCY_BROADCAST");
        
        // Response with details
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Emergency broadcast sent to all " + bloodType + " donors nearby!");
        response.put("bloodType", bloodType);
        response.put("units", units);
        response.put("hospital", hospital);
        response.put("donorsNotified", 150); // Mock value
        
        return ResponseEntity.ok(response);
    }
}
