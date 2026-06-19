package com.cloudbuilder.multiregion.domain.service;

import com.cloudbuilder.multiregion.domain.model.Region;
import com.cloudbuilder.multiregion.domain.port.RegionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
@Service
@Transactional
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    public Region createRegion(String code, String name, String provider, String country, boolean isPrimary) {
        if (regionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Region with code '" + code + "' already exists");
        }
        if (isPrimary) {
            // Ensure only one primary region per provider
            Optional<Region> existingPrimary = regionRepository.findByProviderAndIsActiveTrue(provider)
                    .stream().filter(Region::isPrimary).findFirst();
            if (existingPrimary.isPresent()) {
                throw new IllegalStateException("Primary region already exists for provider: " + provider);
            }
        }
        Region region = new Region(code, name, provider, country, isPrimary);
        return regionRepository.save(region);
    }

    public Optional<Region> getRegion(String id) {
        return regionRepository.findById(id);
    }

    public Optional<Region> getRegionByCode(String code) {
        return regionRepository.findByCode(code);
    }

    public List<Region> getAllRegions() {
        return regionRepository.findAll();
    }

    public List<Region> getActiveRegions() {
        return regionRepository.findAllActiveOrdered();
    }

    public List<Region> getActiveRegionsByProvider(String provider) {
        return regionRepository.findByProviderAndIsActiveTrue(provider);
    }

    public Region updateRegion(String id, String name, String country, Boolean isActive, Boolean isPrimary) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Region not found: " + id));

        if (name != null) region.setName(name);
        if (country != null) region.setCountry(country);
        if (isActive != null) region.setActive(isActive);
        if (isPrimary != null && isPrimary && !region.isPrimary()) {
            // Check for existing primary
            Optional<Region> existingPrimary = regionRepository.findByProviderAndIsActiveTrue(region.getProvider())
                    .stream().filter(Region::isPrimary).findFirst();
            if (existingPrimary.isPresent() && !existingPrimary.get().getId().equals(id)) {
                throw new IllegalStateException("Primary region already exists for provider: " + region.getProvider());
            }
            region.setPrimary(true);
        }
        return regionRepository.save(region);
    }

    public void deleteRegion(String id) {
        if (!regionRepository.existsById(id)) {
            throw new IllegalArgumentException("Region not found: " + id);
        }
        regionRepository.deleteById(id);
    }

    public Region setPrimaryRegion(String id) {
        Region region = regionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Region not found: " + id));

        // Unset existing primary for this provider
        regionRepository.findByProviderAndIsActiveTrue(region.getProvider())
                .stream().filter(Region::isPrimary).forEach(r -> {
                    r.setPrimary(false);
                    regionRepository.save(r);
                });

        region.setPrimary(true);
        return regionRepository.save(region);
    }
}