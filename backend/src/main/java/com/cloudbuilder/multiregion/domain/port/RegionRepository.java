package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface RegionRepository extends JpaRepository<Region, String> {

    Optional<Region> findByCode(String code);

    Optional<Region> findByCodeAndIsActiveTrue(String code);

    List<Region> findByProviderAndIsActiveTrue(String provider);

    List<Region> findByIsPrimaryTrueAndIsActiveTrue();

    @Query("SELECT r FROM Region r WHERE r.isActive = true ORDER BY r.isPrimary DESC, r.name ASC")
    List<Region> findAllActiveOrdered();

    boolean existsByCode(String code);
}