package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.BudgetAlert;
import com.cloudbuilder.cost.domain.port.BudgetAlertRepository;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BudgetAlertService {

    private static final Logger log = LoggerFactory.getLogger(BudgetAlertService.class);

    private final BudgetAlertRepository budgetAlertRepository;
    private final BudgetRepository budgetRepository;
    private final CostRecordRepository costRecordRepository;

    public BudgetAlertService(BudgetAlertRepository budgetAlertRepository,
                              BudgetRepository budgetRepository,
                              CostRecordRepository costRecordRepository) {
        this.budgetAlertRepository = budgetAlertRepository;
        this.budgetRepository = budgetRepository;
        this.costRecordRepository = costRecordRepository;
    }

    // ─── CRUD ─────────────────────────────────────────────────────────

    public BudgetAlert create(BudgetAlert alert) {
        alert.setUpdatedAt(LocalDateTime.now());
        return budgetAlertRepository.save(alert);
    }

    @Transactional(readOnly = true)
    public Optional<BudgetAlert> findById(String id) {
        return budgetAlertRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<BudgetAlert> findByTenantId(String tenantId) {
        return budgetAlertRepository.findByTenantId(tenantId);
    }

    public Optional<BudgetAlert> update(String id, BudgetAlert updated) {
        return budgetAlertRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setBudgetAmount(updated.getBudgetAmount());
            existing.setCurrentSpend(updated.getCurrentSpend());
            existing.setPeriod(updated.getPeriod());
            existing.setWarningThreshold(updated.getWarningThreshold());
            existing.setCriticalThreshold(updated.getCriticalThreshold());
            existing.setUpdatedAt(LocalDateTime.now());
            existing.recalculateStatus();
            return budgetAlertRepository.save(existing);
        });
    }

    public void delete(String id) {
        budgetAlertRepository.deleteById(id);
    }

    // ─── Alert Evaluation ─────────────────────────────────────────────

    /**
     * Recalcula status de todos os alertas com base nos thresholds atuais.
     */
    public List<BudgetAlert> checkAlerts() {
        var all = budgetAlertRepository.findAll();
        for (var alert : all) {
            alert.recalculateStatus();
            alert.setUpdatedAt(LocalDateTime.now());
            budgetAlertRepository.save(alert);
        }
        return all;
    }

    /**
     * Agendado: executa checkAlerts a cada 6 horas.
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void checkAllAlerts() {
        log.info("BudgetAlertService.checkAllAlerts: iniciando verificação agendada de orçamentos");
        var updated = checkAlerts();
        log.info("BudgetAlertService.checkAllAlerts: {} alertas verificados", updated.size());
    }

    // ─── Legacy: evaluateBudgets (usado por CostController) ───────────

    @Transactional(readOnly = true)
    public List<com.cloudbuilder.cost.application.dto.BudgetAlert> evaluateBudgets(String environmentId) {
        var today = LocalDate.now();
        var budgets = budgetRepository.findByEnvironmentId(environmentId);

        List<com.cloudbuilder.cost.application.dto.BudgetAlert> alerts = new ArrayList<>();

        for (var budget : budgets) {
            if (!"ACTIVE".equals(budget.getStatus())) {
                continue;
            }

            if (budget.getEndDate().isBefore(today)) {
                budget.setStatus("EXPIRED");
                budgetRepository.save(budget);
                continue;
            }

            var budgetStart = budget.getStartDate().isBefore(today) ? budget.getStartDate() : today;
            var totalCost = costRecordRepository.findTotalCostInRange(
                    environmentId, budgetStart, today);

            double spentAmount = totalCost != null ? totalCost : 0;
            budget.setSpentAmount(spentAmount);
            budgetRepository.save(budget);

            double limitAmount = budget.getLimitAmount();
            double usagePct = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0;
            usagePct = Math.round(usagePct * 100.0) / 100.0;

            String severity;
            if (usagePct >= 100) {
                severity = "EXCEEDED";
            } else if (usagePct >= 90) {
                severity = "CRITICAL";
            } else if (usagePct >= 80) {
                severity = "WARNING";
            } else {
                continue;
            }

            alerts.add(new com.cloudbuilder.cost.application.dto.BudgetAlert(
                    budget.getId(),
                    budget.getName(),
                    limitAmount,
                    Math.round(spentAmount * 100.0) / 100.0,
                    usagePct,
                    severity,
                    today
            ));
        }

        return alerts;
    }
}
