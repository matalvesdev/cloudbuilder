package com.cloudbuilder.multiregion.domain.port;

import com.cloudbuilder.multiregion.domain.model.RegionHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
@Repository
public interface RegionHealthRepository extends JpaRepository<RegionHealth, String> {

    Optional<RegionHealth> findTopByRegionCodeOrderByCheckedAtDesc(String regionCode);

    @Query("SELECT r FROM RegionHealth r WHERE r.regionCode = :regionCode AND r.checkedAt >= :since ORDER BY r.checkedAt DESC")
    List<RegionHealth> findByRegionCodeSince(@Param("regionCode") String regionCode, @Param("since") Instant since);

    List<RegionHealth> findByStatus(String status);

    @Query("SELECT r FROM RegionHealth r WHERE r.checkedAt = (SELECT MAX(rh.checkedAt) FROM RegionHealth rh WHERE rh.regionCode = r.regionCode)")
    List<RegionHealth> findLatestHealthPerRegion();
}