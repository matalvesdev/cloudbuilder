package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.Budget;
import com.cloudbuilder.cost.domain.model.CostRecord;
import com.cloudbuilder.cost.domain.port.BudgetRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class CostService {

    private final CostRecordRepository costRecordRepository;
    private final BudgetRepository budgetRepository;

    public CostService(CostRecordRepository costRecordRepository, BudgetRepository budgetRepository) {
        this.costRecordRepository = costRecordRepository;
        this.budgetRepository = budgetRepository;
    }

    public CostRecord importCostRecord(CostRecord record) {
        return costRecordRepository.save(record);
    }

    @Transactional(readOnly = true)
    public List<CostRecord> getCosts(String environmentId, LocalDate start, LocalDate end) {
        if (start != null && end != null) {
            return costRecordRepository.findByEnvironmentIdAndDateBetween(environmentId, start, end);
        }
        return costRecordRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getTopServicesByCost(String environmentId) {
        return costRecordRepository.findTopServicesByCost(environmentId);
    }

    @Transactional(readOnly = true)
    public double getTotalCost(String environmentId, LocalDate start, LocalDate end) {
        var total = costRecordRepository.findTotalCostInRange(environmentId, start, end);
        return total != null ? total : 0;
    }

    public Budget createBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    @Transactional(readOnly = true)
    public List<Budget> getBudgets(String environmentId) {
        return budgetRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public double getMonthlyForecast(String environmentId) {
        var today = LocalDate.now();
        var startOfMonth = today.withDayOfMonth(1);
        var daysInMonth = today.lengthOfMonth();
        var daysElapsed = today.getDayOfMonth();
        if (daysElapsed == 0) return 0;
        var monthTotal = costRecordRepository.findTotalCostInRange(environmentId, startOfMonth, today);
        if (monthTotal == null) return 0;
        return (monthTotal / daysElapsed) * daysInMonth;
    }
}
