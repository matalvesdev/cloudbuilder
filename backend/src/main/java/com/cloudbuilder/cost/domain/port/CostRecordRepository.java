package com.cloudbuilder.cost.domain.port;

import com.cloudbuilder.cost.domain.model.CostRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
public interface CostRecordRepository extends JpaRepository<CostRecord, String> {
    List<CostRecord> findByEnvironmentId(String environmentId);
    List<CostRecord> findByEnvironmentIdAndDateBetween(String environmentId, LocalDate start, LocalDate end);
    List<CostRecord> findByEnvironmentIdAndProvider(String environmentId, String provider);
    List<CostRecord> findByEnvironmentIdAndServiceNameAndDateBetween(String environmentId, String serviceName, LocalDate start, LocalDate end);

    @Query("SELECT c.serviceName, SUM(c.amount) FROM CostRecord c WHERE c.environmentId = ?1 GROUP BY c.serviceName ORDER BY SUM(c.amount) DESC")
    List<Object[]> findTopServicesByCost(String environmentId);

    @Query("SELECT SUM(c.amount) FROM CostRecord c WHERE c.environmentId = ?1 AND c.date BETWEEN ?2 AND ?3")
    Double findTotalCostInRange(String environmentId, LocalDate start, LocalDate end);

    @Query("SELECT c.date, SUM(c.amount) FROM CostRecord c WHERE c.environmentId = ?1 AND c.date >= ?2 GROUP BY c.date ORDER BY c.date")
    List<Object[]> findDailyTotalsSince(String environmentId, LocalDate since);
}
