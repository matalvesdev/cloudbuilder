package com.cloudbuilder.cost.application.dto;

import java.time.LocalDate;

public record BudgetAlert(
        String budgetId,
        String budgetName,
        double limitAmount,
        double spentAmount,
        double usagePct,
        String severity,
        LocalDate evaluatedAt
) {
}
