package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.RegionHealth;
import com.cloudbuilder.multiregion.domain.port.RegionHealthRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RegionHealthService {

    private final RegionHealthRepository healthRepository;

    public RegionHealthService(RegionHealthRepository healthRepository) {
        this.healthRepository = healthRepository;
    }

    public RegionHealth recordHealthCheck(String regionCode, String status, double latencyMs, double availabilityPercent, String details) {
        RegionHealth health = new RegionHealth(regionCode, status, latencyMs, availabilityPercent);
        health.setDetails(details);
        return healthRepository.save(health);
    }

    public Optional<RegionHealth> getLatestHealth(String regionCode) {
        return healthRepository.findTopByRegionCodeOrderByCheckedAtDesc(regionCode);
    }

    public List<RegionHealth> getHealthHistory(String regionCode, Instant since) {
        return healthRepository.findByRegionCodeSince(regionCode, since);
    }

    public List<RegionHealth> getAllLatestHealth() {
        return healthRepository.findLatestHealthPerRegion();
    }

    public List<RegionHealth> getUnhealthyRegions() {
        return healthRepository.findByStatus("DOWN");
    }

    public List<RegionHealth> getDegradedRegions() {
        return healthRepository.findByStatus("DEGRADED");
    }

    public List<RegionHealth> getMaintenanceRegions() {
        return healthRepository.findByStatus("MAINTENANCE");
    }
}