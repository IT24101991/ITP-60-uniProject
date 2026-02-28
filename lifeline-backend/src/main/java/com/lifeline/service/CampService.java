package com.lifeline.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class CampService {

    private final List<Map<String, Object>> camps = new ArrayList<>();

    public CampService() {
        seedCamp(1, "Colombo Camp", "Western", "Colombo", "Colombo City Centre",
                "2026-03-10", "09:00", "13:00", "Colombo National Hospital", "", 6.9271, 79.8612);
        seedCamp(2, "Kandy Drive", "Central", "Kandy", "Kandy City Center",
                "2026-03-15", "10:30", "14:30", "Kandy General Hospital", "", 7.2906, 80.6337);
        seedCamp(3, "Galle Donation Event", "Southern", "Galle", "Galle Fort",
                "2026-03-20", "08:30", "12:30", "Galle Teaching Hospital", "", 6.0535, 80.2210);
    }

    private void seedCamp(int id, String name, String province, String district, String location,
                          String date, String startTime, String endTime, String nearestHospital,
                          String googleMapLink, double lat, double lng) {
        Map<String, Object> camp = new HashMap<>();
        camp.put("id", id);
        camp.put("name", name);
        camp.put("province", province);
        camp.put("district", district);
        camp.put("location", location);
        camp.put("date", date);
        camp.put("startTime", startTime);
        camp.put("endTime", endTime);
        camp.put("nearestHospital", nearestHospital);
        camp.put("googleMapLink", googleMapLink);
        camp.put("lat", lat);
        camp.put("lng", lng);
        camp.put("interestCount", 0);
        camps.add(camp);
    }

    public synchronized List<Map<String, Object>> getAllCamps() {
        List<Map<String, Object>> withStatus = new ArrayList<>();
        for (Map<String, Object> camp : camps) {
            withStatus.add(enrichCamp(camp));
        }
        return withStatus;
    }

    public synchronized Optional<Map<String, Object>> findCampById(int id) {
        return camps.stream()
                .filter(c -> Integer.parseInt(c.get("id").toString()) == id)
                .findFirst();
    }

    public synchronized Optional<Map<String, Object>> findCampByIdWithStatus(int id) {
        return findCampById(id).map(this::enrichCamp);
    }

    public synchronized Map<String, Object> createCamp(Map<String, Object> campData) {
        int maxId = camps.stream()
                .mapToInt(c -> Integer.parseInt(c.get("id").toString()))
                .max()
                .orElse(0);
        campData.put("id", maxId + 1);

        if (!campData.containsKey("date")) {
            campData.put("date", LocalDate.now().plusDays(1).toString());
        }
        if (!campData.containsKey("startTime")) {
            campData.put("startTime", "09:00");
        }
        if (!campData.containsKey("endTime")) {
            campData.put("endTime", "13:00");
        }
        if (!campData.containsKey("interestCount")) {
            campData.put("interestCount", 0);
        }
        if (!campData.containsKey("lat")) {
            campData.put("lat", 6.9271);
        }
        if (!campData.containsKey("lng")) {
            campData.put("lng", 79.8612);
        }
        if (!campData.containsKey("province")) {
            campData.put("province", "Western");
        }
        if (!campData.containsKey("district")) {
            campData.put("district", "Colombo");
        }
        if (!campData.containsKey("nearestHospital")) {
            campData.put("nearestHospital", "Colombo National Hospital");
        }
        if (!campData.containsKey("googleMapLink")) {
            campData.put("googleMapLink", "");
        }

        LocalDateTime start = getCampStart(campData);
        LocalDateTime end = getCampEnd(campData);
        if (!end.isAfter(start)) {
            throw new RuntimeException("Camp end time must be after start time.");
        }

        camps.add(campData);
        return enrichCamp(campData);
    }

    public synchronized Optional<Map<String, Object>> deleteCamp(int id) {
        Iterator<Map<String, Object>> iterator = camps.iterator();
        while (iterator.hasNext()) {
            Map<String, Object> camp = iterator.next();
            if (Integer.parseInt(camp.get("id").toString()) == id) {
                iterator.remove();
                return Optional.of(enrichCamp(camp));
            }
        }
        return Optional.empty();
    }

    public synchronized Optional<Map<String, Object>> registerInterest(int id) {
        Optional<Map<String, Object>> campOpt = findCampById(id);
        if (campOpt.isEmpty()) {
            return Optional.empty();
        }
        Map<String, Object> camp = campOpt.get();
        int current = Integer.parseInt(String.valueOf(camp.getOrDefault("interestCount", 0)));
        camp.put("interestCount", current + 1);
        return Optional.of(enrichCamp(camp));
    }

    public LocalDateTime getCampStart(Map<String, Object> camp) {
        LocalDate date = LocalDate.parse(String.valueOf(camp.get("date")));
        LocalTime start = LocalTime.parse(String.valueOf(camp.getOrDefault("startTime", camp.getOrDefault("time", "09:00"))));
        return LocalDateTime.of(date, start);
    }

    public LocalDateTime getCampEnd(Map<String, Object> camp) {
        LocalDate date = LocalDate.parse(String.valueOf(camp.get("date")));
        LocalTime end = LocalTime.parse(String.valueOf(camp.getOrDefault("endTime", "13:00")));
        return LocalDateTime.of(date, end);
    }

    private Map<String, Object> enrichCamp(Map<String, Object> original) {
        Map<String, Object> copy = new HashMap<>(original);
        LocalDateTime start = getCampStart(copy);
        LocalDateTime end = getCampEnd(copy);
        LocalDateTime now = LocalDateTime.now();

        String status;
        if (now.isBefore(start)) {
            status = "UPCOMING";
        } else if (now.isAfter(end)) {
            status = "ENDED";
        } else {
            status = "ONGOING";
        }

        copy.put("campStatus", status);
        if (!copy.containsKey("time")) {
            copy.put("time", copy.getOrDefault("startTime", "09:00"));
        }
        return copy;
    }
}
