package com.cloudbuilder.observability.domain.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Monthly maintenance service that creates new partitions for all
 * time-series partitioned tables before the current month ends.
 * <p>
 * Prevents INSERT failures when data arrives for the next month.
 * Covers observability tables (V9) and docs metadata (V11).
 */
@Service
public class PartitionMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(PartitionMaintenanceService.class);

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy_MM");

    private final EntityManager entityManager;

    public PartitionMaintenanceService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Runs on the 1st of every month at 01:00 UTC.
     * Creates partitions for the next month on all time-series tables.
     */
    @Scheduled(cron = "0 0 1 1 * *")
    @Transactional
    public void createNextMonthPartitions() {
        LocalDate nextMonth = LocalDate.now()
                .plusMonths(1)
                .withDayOfMonth(1);

        String monthLabel = nextMonth.format(MONTH_FMT);
        String startDate = nextMonth.toString();
        String endDate = nextMonth.plusMonths(1).toString();

        log.info("Creating partitions for month: {} ({})", monthLabel, startDate);

        // ── Docs metadata (V11) ──────────────────────────────────
        createPartition("doc_metadata", "doc_metadata_" + monthLabel, startDate, endDate);

        // ── Observability tables (V9) ────────────────────────────
        createPartition("metrics_ts", "metrics_ts_" + monthLabel, startDate, endDate);
        createPartition("traces", "traces_" + monthLabel, startDate, endDate);
        createPartition("spans", "spans_" + monthLabel, startDate, endDate);
        createPartition("logs", "logs_" + monthLabel, startDate, endDate);
        createPartition("alert_rule_evaluations", "alert_eval_" + monthLabel, startDate, endDate);

        log.info("Partition creation complete for month: {}", monthLabel);
    }

    /**
     * Creates a single partition for the given parent table if it does
     * not already exist.
     */
    private void createPartition(String parentTable, String partitionName,
                                  String startDate, String endDate) {
        try {
            // Check if partition already exists
            Query checkQuery = entityManager.createNativeQuery(
                    "SELECT 1 FROM pg_class c " +
                    "JOIN pg_namespace n ON n.oid = c.relnamespace " +
                    "WHERE c.relname = :name AND n.nspname = current_schema()");
            checkQuery.setParameter("name", partitionName);

            boolean exists = !checkQuery.getResultList().isEmpty();
            if (exists) {
                log.debug("Partition already exists: {}", partitionName);
                return;
            }

            // Create the partition
            Query createQuery = entityManager.createNativeQuery(
                    "CREATE TABLE " + partitionName +
                    " PARTITION OF " + parentTable +
                    " FOR VALUES FROM (:start) TO (:end)");
            createQuery.setParameter("start", startDate);
            createQuery.setParameter("end", endDate);
            createQuery.executeUpdate();

            log.info("Created partition: {} on table {}", partitionName, parentTable);
        } catch (Exception e) {
            log.warn("Failed to create partition {} on {}: {}",
                    partitionName, parentTable, e.getMessage());
        }
    }
}
