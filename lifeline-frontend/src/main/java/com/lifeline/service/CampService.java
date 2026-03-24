package com.lifeline.service;

import com.lifeline.model.Camp;
import com.lifeline.repository.CampRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class CampService {

    @Autowired
    private CampRepository campRepository;

    public List<Map<String, Object>> getAllCamps() {
        List<Map<String, Object>> withStatus = new ArrayList<>();
        for (Camp camp : campRepository.findAll()) {
            withStatus.add(enrichCamp(camp));
        }
        return withStatus;
    }

    public Optional<Map<String, Object>> findCampById(int id) {
        return campRepository.findById((long) id).map(this::toCampMap);
    }

    public Optional<Map<String, Object>> findCampByIdWithStatus(int id) {
        return campRepository.findById((long) id).map(this::enrichCamp);
    }

    public Map<String, Object> createCamp(Map<String, Object> campData) {
        Camp camp = buildCampWithDefaults(campData);

        LocalDateTime start = LocalDateTime.of(camp.getDate(), camp.getStartTime());
        LocalDateTime end = LocalDateTime.of(camp.getDate(), camp.getEndTime());

        if (!end.isAfter(start)) {
            throw new RuntimeException("Camp end time must be after start time.");
        }

        Camp saved = campRepository.save(camp);
        return enrichCamp(saved);
    }

    public Optional<Map<String, Object>> updateCamp(int id, Map<String, Object> campData) {
        Optional<Camp> existingOpt = campRepository.findById((long) id);
        if (existingOpt.isEmpty()) {
            return Optional.empty();
        }

        Camp existing = existingOpt.get();

        existing.setName(getString(campData, "name"));
        existing.setLocation(getString(campData, "location"));
        existing.setDate(parseDate(campData.get("date"), existing.getDate()));
        existing.setStartTime(parseTime(campData.get("startTime"), existing.getStartTime()));
        existing.setEndTime(parseTime(campData.get("endTime"), existing.getEndTime()));
        existing.setInterestCount(parseInt(campData.get("interestCount"), existing.getInterestCount() == null ? 0 : existing.getInterestCount()));
        existing.setLat(parseDouble(campData.get("lat"), existing.getLat() == null ? 6.9271 : existing.getLat()));
        existing.setLng(parseDouble(campData.get("lng"), existing.getLng() == null ? 79.8612 : existing.getLng()));
        existing.setProvince(getStringOrDefault(campData, "province", existing.getProvince()));
        existing.setDistrict(getStringOrDefault(campData, "district", existing.getDistrict()));
        existing.setNearestHospital(getStringOrDefault(campData, "nearestHospital", existing.getNearestHospital()));
        existing.setGoogleMapLink(getStringOrDefault(campData, "googleMapLink", existing.getGoogleMapLink()));

        LocalDateTime start = LocalDateTime.of(existing.getDate(), existing.getStartTime());
        LocalDateTime end = LocalDateTime.of(existing.getDate(), existing.getEndTime());

        if (!end.isAfter(start)) {
            throw new RuntimeException("Camp end time must be after start time.");
        }

        Camp saved = campRepository.save(existing);
        return Optional.of(enrichCamp(saved));
    }

    public Optional<Map<String, Object>> deleteCamp(int id) {
        Optional<Camp> campOpt = campRepository.findById((long) id);
        if (campOpt.isEmpty()) {
            return Optional.empty();
        }

        Camp camp = campOpt.get();
        campRepository.delete(camp);
        return Optional.of(enrichCamp(camp));
    }

    public Optional<Map<String, Object>> registerInterest(int id) {
        Optional<Camp> campOpt = campRepository.findById((long) id);
        if (campOpt.isEmpty()) {
            return Optional.empty();
        }

        Camp camp = campOpt.get();
        int current = camp.getInterestCount() == null ? 0 : camp.getInterestCount();
        camp.setInterestCount(current + 1);
        Camp saved = campRepository.save(camp);
        return Optional.of(enrichCamp(saved));
    }

    public LocalDateTime getCampStart(Map<String, Object> camp) {
        LocalDate date = parseDate(camp.get("date"), LocalDate.now());

        String startText = getNonEmptyString(
                camp.get("startTime"),
                camp.get("time"),
                "09:00"
        );

        LocalTime start = parseTime(startText, LocalTime.of(9, 0));
        return LocalDateTime.of(date, start);
    }

    public LocalDateTime getCampEnd(Map<String, Object> camp) {
        LocalDate date = parseDate(camp.get("date"), LocalDate.now());

        String endText = getNonEmptyString(
                camp.get("endTime"),
                "13:00"
        );

        LocalTime end = parseTime(endText, LocalTime.of(13, 0));
        return LocalDateTime.of(date, end);
    }

    private Map<String, Object> enrichCamp(Camp camp) {
        Map<String, Object> copy = toCampMap(camp);
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

        if (copy.get("time") == null) {
            copy.put("time", copy.get("startTime") != null ? copy.get("startTime") : "09:00");
        }

        return copy;
    }

    private Map<String, Object> toCampMap(Camp camp) {
        Map<String, Object> campMap = new HashMap<>();
        campMap.put("id", camp.getId());
        campMap.put("name", camp.getName());
        campMap.put("province", camp.getProvince());
        campMap.put("district", camp.getDistrict());
        campMap.put("location", camp.getLocation());
        campMap.put("date", camp.getDate() != null ? camp.getDate().toString() : null);
        campMap.put("startTime", camp.getStartTime() != null ? camp.getStartTime().toString() : null);
        campMap.put("endTime", camp.getEndTime() != null ? camp.getEndTime().toString() : null);
        campMap.put("nearestHospital", camp.getNearestHospital());
        campMap.put("googleMapLink", camp.getGoogleMapLink());
        campMap.put("lat", camp.getLat());
        campMap.put("lng", camp.getLng());
        campMap.put("interestCount", camp.getInterestCount() == null ? 0 : camp.getInterestCount());
        return campMap;
    }

    private Camp buildCampWithDefaults(Map<String, Object> campData) {
        Camp camp = new Camp();
        camp.setName(getString(campData, "name"));
        camp.setLocation(getString(campData, "location"));
        camp.setDate(parseDate(campData.get("date"), LocalDate.now().plusDays(1)));
        camp.setStartTime(parseTime(campData.get("startTime"), LocalTime.of(9, 0)));
        camp.setEndTime(parseTime(campData.get("endTime"), LocalTime.of(13, 0)));
        camp.setInterestCount(parseInt(campData.get("interestCount"), 0));
        camp.setLat(parseDouble(campData.get("lat"), 6.9271));
        camp.setLng(parseDouble(campData.get("lng"), 79.8612));
        camp.setProvince(getStringOrDefault(campData, "province", "Western"));
        camp.setDistrict(getStringOrDefault(campData, "district", "Colombo"));
        camp.setNearestHospital(getStringOrDefault(campData, "nearestHospital", ""));
        camp.setGoogleMapLink(getStringOrDefault(campData, "googleMapLink", ""));
        return camp;
    }

    private String getString(Map<String, Object> source, String key) {
        Object value = source.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String getStringOrDefault(Map<String, Object> source, String key, String fallback) {
        String value = getString(source, key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private String getNonEmptyString(Object... values) {
        for (Object value : values) {
            if (value == null) continue;
            String text = String.valueOf(value).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }
        return null;
    }

    private LocalDate parseDate(Object value, LocalDate fallback) {
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return fallback;
        }

        return LocalDate.parse(text);
    }

    private LocalTime parseTime(Object value, LocalTime fallback) {
        if (value == null) {
            return fallback;
        }

        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return fallback;
        }

        return LocalTime.parse(text);
    }

    private int parseInt(Object value, int fallback) {
        if (value == null || String.valueOf(value).trim().isEmpty()) {
            return fallback;
        }
        return Integer.parseInt(String.valueOf(value));
    }

    private double parseDouble(Object value, double fallback) {
        if (value == null || String.valueOf(value).trim().isEmpty()) {
            return fallback;
        }
        return Double.parseDouble(String.valueOf(value));
    }
}