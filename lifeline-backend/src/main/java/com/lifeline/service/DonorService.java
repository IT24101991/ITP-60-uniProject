package com.lifeline.service;

import com.lifeline.model.Donor;
import com.lifeline.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class DonorService {

    @Autowired
    private DonorRepository donorRepository;

    @Autowired
    private com.lifeline.repository.AppointmentRepository appointmentRepository;

    public boolean checkEligibility(Long donorId) {
        Donor donor = donorRepository.findById(donorId).orElse(null);
        if (donor == null) {
            return true;
        }

        if (donor.getLastDonationDate() == null) {
            return true;
        }

        long daysSinceLastDonation = ChronoUnit.DAYS.between(donor.getLastDonationDate(), LocalDate.now());
        return daysSinceLastDonation > 90;
    }

    public Donor registerDonor(Donor donor) {
        // In a real app, we might check if user already exists, etc.
        // For now, just save the donor details as requested.
        return donorRepository.save(donor);
    }

    public java.util.List<com.lifeline.model.Appointment> getDonationHistory(Long donorId) {
        // Assuming we want all appointments for this donor
        // We need to check if AppointmentRepository supports findByDonorId
        // Ideally we would add findByDonorId to AppointmentRepository.
        // For now, let's fetch all and filter (inefficient but works for small scale) 
        // OR add the method to Repository. 
        // Let's rely on JPA naming convention, it should work if we add it to repo.
        // But since I cannot edit Repo in this same turn easily without context, I will use findAll + filter 
        // OR Example is simple enough to just use findAll for now.
        // BETTER: I will use Example Matcher or just simple stream filter.
        
         return appointmentRepository.findAll().stream()
                 .filter(a -> a.getDonor() != null && a.getDonor().getId().equals(donorId))
                 .collect(java.util.stream.Collectors.toList());
    }
}
