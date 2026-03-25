package com.lifeline.service;

import com.lifeline.model.Donor;
import com.lifeline.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    public boolean checkEligibility(Long id) {
        Map<String, Object> details = getEligibilityDetails(id);
        return (boolean) details.getOrDefault("eligible", true);
    }

    public java.util.Map<String, Object> getEligibilityDetails(Long id) {
        // Try User ID first
        Donor donor = donorRepository.findByUser_Id(id).orElse(null);
        
        // If not found, try as Donor ID
        if (donor == null) {
            donor = donorRepository.findById(id).orElse(null);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        if (donor == null) {
            result.put("eligible", true);
            return result;
        }

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            String positiveReason = donor.getPositiveReason();
            String reason = (positiveReason != null && !positiveReason.isBlank())
                    ? "You are not eligible to donate because your latest lab test was marked positive (" + positiveReason + "). Please consult a doctor."
                    : "You are not eligible to donate because your latest lab test was marked positive.";
            result.put("eligible", false);
            result.put("reason", reason);
            result.put("type", "SAFETY");
            result.put("safetyStatus", donor.getSafetyStatus());
            if (positiveReason != null && !positiveReason.isBlank()) {
                result.put("positiveReason", positiveReason);
            }
            return result;
        }

        // 2. Check profile lastDonationDate for 60-day waiting period
        LocalDate today = LocalDate.now();
        if (donor.getLastDonationDate() != null) {
            long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), today);
            if (daysSinceLastDonation < 60) {
                long daysRemaining = 60 - daysSinceLastDonation;
                LocalDate nextEligibleDate = donor.getLastDonationDate().plusDays(60);
                result.put("eligible", false);
                result.put("reason", "You are not eligible yet. You donated recently and must wait at least 60 days before booking again.");
                result.put("daysRemaining", daysRemaining);
                result.put("nextEligibleDate", nextEligibleDate.toString());
                result.put("type", "RECENT_DONATION");
                return result;
            }
        }

        result.put("eligible", true);
        return result;
    }

    public boolean isEligibleForDate(Donor donor, LocalDate targetDate) {
        if (donor == null) return true;

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            return false;
        }

        // 2. Check 60-day rule from donor profile (last completed donation date)
        if (donor.getLastDonationDate() != null) {
            long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), targetDate);
            if (daysSinceLastDonation >= 0 && daysSinceLastDonation < 60) {
                return false;
            }
            if (daysSinceLastDonation < 0) {
                return false;
            }
        }

        return true;
    }

    public Donor registerDonor(Donor donor) {
        // In a real app, we might check if user already exists, etc.
        // For now, just save the donor details as requested.
        return donorRepository.save(donor);
    }

    public java.util.Optional<Donor> getDonorByUserId(Long userId) {
        return donorRepository.findByUser_Id(userId);
    }
}
