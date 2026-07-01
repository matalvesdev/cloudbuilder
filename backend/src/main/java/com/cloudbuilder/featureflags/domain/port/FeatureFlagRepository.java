package com.cloudbuilder.featureflags.domain.port;

import com.cloudbuilder.featureflags.domain.model.FeatureFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, String> {

    List<FeatureFlag> findByTenantId(String tenantId);

    List<FeatureFlag> findByTenantIdIsNull();

    Optional<FeatureFlag> findByFlagKeyAndTenantId(String flagKey, String tenantId);

    Optional<FeatureFlag> findByFlagKeyAndTenantIdIsNull(String flagKey);

    @Query("SELECT f FROM FeatureFlag f WHERE f.tenantId = :tenantId OR f.tenantId IS NULL")
    List<FeatureFlag> findAllForTenant(@Param("tenantId") String tenantId);

    @Query("SELECT f.enabled FROM FeatureFlag f WHERE f.flagKey = :flagKey AND (f.tenantId = :tenantId OR f.tenantId IS NULL) ORDER BY f.tenantId DESC")
    List<Boolean> findEnabledForFlagKeyAndTenant(@Param("flagKey") String flagKey, @Param("tenantId") String tenantId);
}
