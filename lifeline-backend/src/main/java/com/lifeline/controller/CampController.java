package com.lifeline.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/camps")
@CrossOrigin(origins = "http://localhost:5173")
public class CampController {

    // Using a static list to simulate persistence for this session
    private static final List<Map<String, Object>> camps = new ArrayList<>();

    static {
        Map<String, Object> camp1 = baseCamp(1, "Colombo Camp", "Colombo City Centre",
                "2026-03-10", "09:00", 6.9271, 79.8612,
                50, List.of("O+", "A+", "B+", "AB+"));
        Map<String, Object> camp2 = baseCamp(2, "Kandy Drive", "Kandy City Center",
                "2026-03-15", "10:30", 7.2906, 80.6337,
                40, List.of("O+", "A+", "O-", "A-"));
        Map<String, Object> camp3 = baseCamp(3, "Galle Donation Event", "Galle Fort",
                "2026-03-20", "08:30", 6.0535, 80.2210,
                35, List.of("O+", "B+", "AB+"));

        camps.add(camp1);
        camps.add(camp2);
        camps.add(camp3);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCamps() {
        return ResponseEntity.ok(camps);
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createCamp(@RequestBody Map<String, Object> campData) {
        int newId = camps.size() + 1;
        String name = stringOrDefault(campData.get("name"), "New Camp");
        String location = stringOrDefault(campData.get("location"), "Unknown Location");
        String date = stringOrDefault(campData.get("date"), "2026-03-10");
        String time = stringOrDefault(campData.get("time"), "09:00");

        int capacity = 50;
        if (campData.get("capacity") != null) {
            try {
                capacity = Integer.parseInt(campData.get("capacity").toString());
            } catch (NumberFormatException ignored) {
            }
        }

        Object rbt = campData.get("requiredBloodTypes");
        List<String> requiredBloodTypes = new ArrayList<>();
        if (rbt instanceof List<?>) {
            for (Object o : (List<?>) rbt) {
                if (o != null) {
                    requiredBloodTypes.add(o.toString());
                }
            }
        } else if (rbt != null) {
            requiredBloodTypes.add(rbt.toString());
        }

        double lat = 6.9271;
        double lng = 79.8612;
        if (campData.get("lat") != null) {
            try {
                lat = Double.parseDouble(campData.get("lat").toString());
            } catch (NumberFormatException ignored) {
            }
        }
        if (campData.get("lng") != null) {
            try {
                lng = Double.parseDouble(campData.get("lng").toString());
            } catch (NumberFormatException ignored) {
            }
        }

        Map<String, Object> camp = baseCamp(newId, name, location, date, time, lat, lng, capacity, requiredBloodTypes);
        camps.add(camp);
        return ResponseEntity.ok(camp);
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerForCamp(@PathVariable int id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> camp = findCampById(id);
        if (camp == null) {
            return ResponseEntity.notFound().build();
        }

        Long donorUserId = payload.get("donorUserId") != null ? Long.parseLong(payload.get("donorUserId").toString()) : null;
        String donorName = stringOrDefault(payload.get("donorName"), "Unknown Donor");

        if (donorUserId == null) {
            return ResponseEntity.badRequest().body("donorUserId is required");
        }

        List<Map<String, Object>> registrations = getRegistrations(camp);

        int capacity = 0;
        if (camp.get("capacity") != null) {
            try {
                capacity = Integer.parseInt(camp.get("capacity").toString());
            } catch (NumberFormatException ignored) {
            }
        }

        if (capacity > 0 && registrations.size() >= capacity) {
            return ResponseEntity.badRequest().body("Camp capacity is full");
        }

        for (Map<String, Object> reg : registrations) {
            Object existingId = reg.get("donorUserId");
            if (existingId != null && Long.parseLong(existingId.toString()) == donorUserId) {
                return ResponseEntity.ok(camp);
            }
        }

        Map<String, Object> registration = new HashMap<>();
        registration.put("donorUserId", donorUserId);
        registration.put("donorName", donorName);
        registration.put("checkedIn", false);
        registrations.add(registration);

        return ResponseEntity.ok(camp);
    }

    @PostMapping("/{id}/check-in")
    public ResponseEntity<?> checkInDonor(@PathVariable int id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> camp = findCampById(id);
        if (camp == null) {
            return ResponseEntity.notFound().build();
        }

        Long donorUserId = payload.get("donorUserId") != null ? Long.parseLong(payload.get("donorUserId").toString()) : null;
        if (donorUserId == null) {
            return ResponseEntity.badRequest().body("donorUserId is required");
        }

        List<Map<String, Object>> registrations = getRegistrations(camp);
        boolean updated = false;
        for (Map<String, Object> reg : registrations) {
            Object existingId = reg.get("donorUserId");
            if (existingId != null && Long.parseLong(existingId.toString()) == donorUserId) {
                reg.put("checkedIn", true);
                updated = true;
                break;
            }
        }

        if (!updated) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(camp);
    }

    @GetMapping("/registrations")
    public ResponseEntity<List<Map<String, Object>>> getRegistrationsForUser(@RequestParam(required = false) Long donorUserId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> camp : camps) {
            List<Map<String, Object>> registrations = getRegistrations(camp);
            for (Map<String, Object> reg : registrations) {
                Object existingId = reg.get("donorUserId");
                if (donorUserId == null || (existingId != null && Long.parseLong(existingId.toString()) == donorUserId)) {
                    Map<String, Object> row = new HashMap<>();
                    row.put("campId", camp.get("id"));
                    row.put("campName", camp.get("name"));
                    row.put("location", camp.get("location"));
                    row.put("date", camp.get("date"));
                    row.put("time", camp.get("time"));
                    row.put("donorUserId", existingId);
                    row.put("donorName", reg.get("donorName"));
                    row.put("checkedIn", reg.get("checkedIn"));
                    result.add(row);
                }
            }
        }
        return ResponseEntity.ok(result);
    }

    private static Map<String, Object> baseCamp(int id,
                                                String name,
                                                String location,
                                                String date,
                                                String time,
                                                double lat,
                                                double lng,
                                                int capacity,
                                                List<String> requiredBloodTypes) {
        Map<String, Object> camp = new HashMap<>();
        camp.put("id", id);
        camp.put("name", name);
        camp.put("location", location);
        camp.put("date", date);
        camp.put("time", time);
        camp.put("lat", lat);
        camp.put("lng", lng);
        camp.put("capacity", capacity);
        camp.put("requiredBloodTypes", requiredBloodTypes != null ? requiredBloodTypes : List.of());
        camp.put("registrations", new ArrayList<Map<String, Object>>());
        return camp;
    }

    private static Map<String, Object> findCampById(int id) {
        for (Map<String, Object> camp : camps) {
            Object campId = camp.get("id");
            if (campId != null && Integer.parseInt(campId.toString()) == id) {
                return camp;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> getRegistrations(Map<String, Object> camp) {
        Object existing = camp.get("registrations");
        if (existing instanceof List<?>) {
            return (List<Map<String, Object>>) existing;
        }
        List<Map<String, Object>> list = new ArrayList<>();
        camp.put("registrations", list);
        return list;
    }

    private static String stringOrDefault(Object value, String def) {
        return value != null ? value.toString() : def;
    }
}
