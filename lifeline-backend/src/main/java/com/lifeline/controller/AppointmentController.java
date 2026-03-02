package com.lifeline.controller;

import com.lifeline.model.Appointment;
import com.lifeline.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173") // Allow React Frontend
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> payload) {
        try {
            Long donorId = Long.valueOf(payload.get("donorId").toString());
            Long hospitalId = Long.valueOf(payload.get("hospitalId").toString());
            Long donorUserId = payload.get("donorUserId") != null ? Long.valueOf(payload.get("donorUserId").toString()) : null;
            String donorName = payload.get("donorName") != null ? payload.get("donorName").toString() : null;
            String centerType = payload.get("centerType") != null ? payload.get("centerType").toString() : "HOSPITAL";
            String bloodType = payload.get("bloodType") != null ? payload.get("bloodType").toString() : null;
            String centerName = payload.get("centerName") != null ? payload.get("centerName").toString() : null;
            // Assuming date is passed as ISO string
            String dateString = payload.get("date").toString();
            LocalDateTime time;
            try {
                time = LocalDateTime.parse(dateString);
            } catch (Exception parseError) {
                time = OffsetDateTime.parse(dateString).toLocalDateTime();
            }

            Appointment appointment = appointmentService.bookAppointment(donorId, hospitalId, time, donorUserId, donorName, centerType, bloodType, centerName);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error booking appointment");
        }
    }

    @GetMapping("/donor/{donorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsForDonor(@PathVariable Long donorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForDonor(donorId));
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            String status = payload.getOrDefault("status", "Scheduled").toString();
            Appointment updated = appointmentService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating status");
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            Appointment updated = appointmentService.updateStatus(id, "Cancelled");
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointment", updated);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error cancelling appointment");
        }
    }
}
