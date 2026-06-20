package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.application.dto.BudgetAlert;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class BudgetAlertService {

    private final BudgetRepository budgetRepository;
    private final CostRecordRepository costRecordRepository;

    public BudgetAlertService(BudgetRepository budgetRepository, CostRecordRepository costRecordRepository) {
        this.budgetRepository = budgetRepository;
        this.costRecordRepository = costRecordRepository;
    }

    /**
     * Avalia todos os budgets ativos de um ambiente e retorna alertas
     * baseados no percentual de uso em relacao ao limite.
     */
    public List<BudgetAlert> evaluateBudgets(String environmentId) {
        var today = LocalDate.now();
        var budgets = budgetRepository.findByEnvironmentId(environmentId);

        List<BudgetAlert> alerts = new ArrayList<>();

        for (var budget : budgets) {
            if (!"ACTIVE".equals(budget.getStatus())) {
                continue;
            }

            // Verifica se esta dentro do periodo orcamentario
            if (budget.getEndDate().isBefore(today)) {
                budget.setStatus("EXPIRED");
                budgetRepository.save(budget);
                continue;
            }

            // Calcula gasto real no periodo do budget
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
                continue; // abaixo de 80%, sem alerta
            }

            alerts.add(new BudgetAlert(
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
