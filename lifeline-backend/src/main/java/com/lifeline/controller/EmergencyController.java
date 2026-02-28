package com.lifeline.controller;

import com.lifeline.model.EmergencyRequest;
import com.lifeline.service.ActivityService;
import com.lifeline.service.EmergencyRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "http://localhost:5173")
public class EmergencyController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private EmergencyRequestService emergencyRequestService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestEmergencyBlood(@RequestBody Map<String, Object> payload) {
        String bloodType = (String) payload.getOrDefault("bloodType", "Unknown");
        Integer units = payload.get("units") != null ? Integer.parseInt(payload.get("units").toString()) : 1;
        String hospital = (String) payload.getOrDefault("hospital", "Unknown Hospital");
        String urgency = (String) payload.getOrDefault("urgency", "CRITICAL");

        EmergencyRequest savedRequest = emergencyRequestService.create(bloodType, units, hospital, urgency);
        
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
        response.put("requestId", savedRequest.getId());
        response.put("donorsNotified", 150); // Mock value
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests")
    public ResponseEntity<List<EmergencyRequest>> getActiveRequests() {
        return ResponseEntity.ok(emergencyRequestService.getActiveRequests());
    }

    @GetMapping("/requests/all")
    public ResponseEntity<List<EmergencyRequest>> getAllRequests() {
        return ResponseEntity.ok(emergencyRequestService.getAllRequests());
    }

    @PutMapping("/requests/{id}/fulfill")
    public ResponseEntity<?> fulfillEmergencyRequest(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            int units = payload.get("units") != null ? Integer.parseInt(payload.get("units").toString()) : 0;
            EmergencyRequest updated = emergencyRequestService.fulfill(id, units);

            String activityDesc = String.format("Emergency supply dispatched: %d units of %s to %s",
                    units, updated.getBloodType(), updated.getHospital());
            activityService.logActivity(activityDesc, "EMERGENCY_FULFILLMENT");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("request", updated);
            response.put("message", "Emergency request updated.");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
