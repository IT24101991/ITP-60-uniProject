package com.lifeline.service;

import com.lifeline.model.Appointment;
import com.lifeline.model.Donor;
import com.lifeline.repository.AppointmentRepository;
import com.lifeline.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DonorService donorService;

    @Autowired
    private DonorRepository donorRepository;

    public Appointment bookAppointment(Long donorId, Long hospitalId, LocalDateTime time, Long donorUserId, String donorName) {
        Donor donor = donorRepository.findById(donorId).orElse(null);
        if (donor == null) {
            Donor newDonor = new Donor();
            donor = donorRepository.save(newDonor);
        }

        // Check Eligibility after ensuring a donor record exists
        boolean isEligible = donorService.checkEligibility(donor.getId());
        if (!isEligible) {
            throw new RuntimeException("Donor not eligible yet");
        }

        // 3. Create Appointment
        Appointment appointment = new Appointment();
        appointment.setDonor(donor);
        appointment.setDonorUserId(donorUserId);
        appointment.setDonorName(donorName);
        appointment.setHospitalId(hospitalId);
        appointment.setDate(time.toLocalDate());
        appointment.setTime(time.toLocalTime());
        appointment.setStatus("Scheduled");

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsForDonor(Long donorId) {
        List<Appointment> byUserId = appointmentRepository.findByDonorUserId(donorId);
        if (byUserId != null && !byUserId.isEmpty()) {
            return byUserId;
        }
        return appointmentRepository.findByDonor_Id(donorId);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment updateStatus(Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }
}
