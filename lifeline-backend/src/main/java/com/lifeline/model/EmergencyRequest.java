package com.lifeline.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 8)
    private String bloodType;

    @Column(nullable = false)
    private Integer unitsRequested;

    @Column(nullable = false)
    private Integer unitsFulfilled;

    @Column(nullable = false, length = 160)
    private String hospital;

    @Column(nullable = false, length = 32)
    private String urgency;

    @Column(nullable = false, length = 24)
    private String status; // OPEN, PARTIAL, FULFILLED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (unitsFulfilled == null) {
            unitsFulfilled = 0;
        }
        if (status == null || status.isBlank()) {
            status = "OPEN";
        }
    }
}
