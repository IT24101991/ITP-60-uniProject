package com.lifeline.service;

import com.lifeline.model.EmergencyRequest;
import com.lifeline.model.Inventory;
import com.lifeline.repository.EmergencyRequestRepository;
import com.lifeline.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class EmergencyRequestService {

    @Autowired
    private EmergencyRequestRepository emergencyRequestRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    public EmergencyRequest create(String bloodType, int units, String hospital, String urgency) {
        EmergencyRequest request = new EmergencyRequest();
        request.setBloodType(bloodType);
        request.setUnitsRequested(units);
        request.setUnitsFulfilled(0);
        request.setHospital(hospital);
        request.setUrgency(urgency);
        request.setStatus("OPEN");
        return emergencyRequestRepository.save(request);
    }

    public List<EmergencyRequest> getActiveRequests() {
        return emergencyRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> !"FULFILLED".equalsIgnoreCase(r.getStatus()))
                .toList();
    }

    public List<EmergencyRequest> getAllRequests() {
        return emergencyRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public EmergencyRequest fulfill(Long requestId, int unitsToSend) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Emergency request not found"));

        if (unitsToSend <= 0) {
            throw new RuntimeException("Units to send must be greater than zero.");
        }

        int remaining = request.getUnitsRequested() - request.getUnitsFulfilled();
        if (remaining <= 0) {
            throw new RuntimeException("Request already fulfilled.");
        }

        int send = Math.min(remaining, unitsToSend);
        int sentFromStock = consumeInventory(request.getBloodType(), send);
        if (sentFromStock <= 0) {
            throw new RuntimeException("No usable stock available for blood type " + request.getBloodType());
        }

        request.setUnitsFulfilled(request.getUnitsFulfilled() + sentFromStock);
        if (request.getUnitsFulfilled() >= request.getUnitsRequested()) {
            request.setStatus("FULFILLED");
            return emergencyRequestRepository.save(request);
        }

        request.setStatus("PARTIAL");
        return emergencyRequestRepository.save(request);
    }

    private int consumeInventory(String bloodType, int needed) {
        int remaining = needed;
        LocalDate today = LocalDate.now();

        List<Inventory> candidates = inventoryRepository.findAll().stream()
                .filter(item -> bloodType.equalsIgnoreCase(item.getBloodType()))
                .filter(item -> item.getQuantity() != null && item.getQuantity() > 0)
                .filter(item -> item.getExpiryDate() == null || !item.getExpiryDate().isBefore(today))
                .filter(item -> {
                    String safety = item.getSafetyFlag() == null ? "" : item.getSafetyFlag().toUpperCase();
                    String status = item.getStatus() == null ? "" : item.getStatus().toUpperCase();
                    return "SAFE".equals(safety) || "SAFE".equals(status) || "AVAILABLE".equals(status);
                })
                .sorted(Comparator.comparing(Inventory::getExpiryDate, Comparator.nullsLast(LocalDate::compareTo)))
                .toList();

        for (Inventory bag : candidates) {
            if (remaining <= 0) break;
            int qty = bag.getQuantity();
            int use = Math.min(qty, remaining);
            bag.setQuantity(qty - use);
            if (bag.getQuantity() == 0) {
                bag.setStatus("USED");
            }
            inventoryRepository.save(bag);
            remaining -= use;
        }

        return needed - remaining;
    }
}
