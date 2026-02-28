package com.lifeline.service;

import com.lifeline.model.Donor;
import com.lifeline.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private com.lifeline.repository.AppointmentRepository appointmentRepository;

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

        Long donorId = donor.getId();
        Long userId = donor.getUser() != null ? donor.getUser().getId() : null;

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            result.put("eligible", false);
            result.put("reason", "Account is blocked due to safety status: " + donor.getSafetyStatus());
            result.put("type", "SAFETY");
            return result;
        }

        // 2. Check all relevant appointments for 60-day rule gap from today
        LocalDate today = LocalDate.now();
        List<com.lifeline.model.Appointment> appointments = getDonationHistory(donorId, userId);
        
        // Check lastDonationDate field as a primary indicator
        if (donor.getLastDonationDate() != null) {
            long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), today);
            if (daysSinceLastDonation < 60) {
                result.put("eligible", false);
                result.put("reason", "You cannot book an appointment because you have given blood less than 60 days ago.");
                result.put("daysRemaining", 60 - daysSinceLastDonation);
                result.put("nextEligibleDate", donor.getLastDonationDate().plusDays(60).toString());
                result.put("type", "RECENT_DONATION");
                return result;
            }
        }

        // Check for any appointments (Completed, Scheduled, Approved) within 60 days
        for (com.lifeline.model.Appointment appt : appointments) {
            if ("Cancelled".equalsIgnoreCase(appt.getStatus())) continue;
            
            if (appt.getDate() != null) {
                long daysDiff = ChronoUnit.DAYS.between(appt.getDate(), today);
                
                // If it's a past appointment that should have updated lastDonationDate but didn't
                if (daysDiff >= 0 && daysDiff < 60 && "Completed".equalsIgnoreCase(appt.getStatus())) {
                    result.put("eligible", false);
                    result.put("reason", "You cannot book an appointment because you have given blood less than 60 days ago.");
                    result.put("nextEligibleDate", appt.getDate().plusDays(60).toString());
                    result.put("type", "RECENT_DONATION");
                    return result;
                }

                // If it's a future scheduled appointment
                if (daysDiff < 0) {
                    result.put("eligible", false);
                    result.put("reason", "You already have a scheduled donation appointment on " + appt.getDate() + ".");
                    result.put("type", "EXISTING_BOOKING");
                    result.put("appointmentDate", appt.getDate().toString());
                    return result;
                }
            }
        }

        result.put("eligible", true);
        return result;
    }

    public boolean isEligibleForDate(Donor donor, LocalDate targetDate) {
        if (donor == null) return true;

        Long donorId = donor.getId();
        Long userId = donor.getUser() != null ? donor.getUser().getId() : null;

        // 1. Check if permanently blocked due to positive test
        if ("POSITIVE".equalsIgnoreCase(donor.getSafetyStatus()) || "BLOCKED".equalsIgnoreCase(donor.getSafetyStatus())) {
            return false;
        }

        // 2. Check 60-day rule from last COMPLETED donation field
        if (donor.getLastDonationDate() != null) {
            long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), targetDate);
            if (daysSinceLastDonation < 60 && daysSinceLastDonation >= -60) {
                // We also block if targetDate is within 60 days BEFORE lastDonationDate (unlikely but safe)
                // but main check is for 60 days AFTER.
                if (daysSinceLastDonation >= 0) return false;
            }
        }

        // 3. Check for any non-cancelled appointments that would conflict
        List<com.lifeline.model.Appointment> appointments = getDonationHistory(donorId, userId);
        for (com.lifeline.model.Appointment appt : appointments) {
            if (!"Cancelled".equalsIgnoreCase(appt.getStatus())) {
                if (appt.getDate() != null) {
                    long daysDiff = Math.abs(ChronoUnit.DAYS.between(appt.getDate(), targetDate));
                    if (daysDiff < 60) {
                        return false;
                    }
                }
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

    public java.util.List<com.lifeline.model.Appointment> getDonationHistory(Long donorId, Long userId) {
        java.util.Set<com.lifeline.model.Appointment> all = new java.util.HashSet<>();
        if (donorId != null) {
            all.addAll(appointmentRepository.findByDonor_Id(donorId));
        }
        if (userId != null) {
            all.addAll(appointmentRepository.findByDonorUserId(userId));
        }
        return new java.util.ArrayList<>(all);
    }
}
