package com.lifeline.repository;

import com.lifeline.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    java.util.List<Appointment> findByDonor_Id(Long donorId);
    java.util.List<Appointment> findByDonorUserId(Long donorUserId);
}
