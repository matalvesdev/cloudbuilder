package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.application.dto.CostProjectionPoint;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CostProjectionService {

    private final CostRecordRepository costRecordRepository;

    public CostProjectionService(CostRecordRepository costRecordRepository) {
        this.costRecordRepository = costRecordRepository;
    }

    /**
     * Projeta custos usando regressao linear (minimos quadrados)
     * nos ultimos 90 dias de dados diarios agregados.
     * Retorna projecao para projectionDays com intervalo de confianca de 95%.
     */
    public List<CostProjectionPoint> projectCosts(String environmentId, int projectionDays) {
        var today = LocalDate.now();
        var since = today.minusDays(90);

        var dailyTotals = costRecordRepository.findDailyTotalsSince(environmentId, since);

        if (dailyTotals.size() < 2) {
            return List.of();
        }

        // Converte para arrays para regressao linear
        int n = dailyTotals.size();
        double[] x = new double[n];
        double[] y = new double[n];

        LocalDate firstDate = (LocalDate) dailyTotals.get(0)[0];
        for (int i = 0; i < n; i++) {
            LocalDate date = (LocalDate) dailyTotals.get(i)[0];
            x[i] = ChronoUnit.DAYS.between(firstDate, date);
            y[i] = ((Number) dailyTotals.get(i)[1]).doubleValue();
        }

        // Calcula coeficientes da regressao linear: y = a + b * x
        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
        }

        double slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        double intercept = (sumY - slope * sumX) / n;

        // Calcula erro padrao da estimativa
        double sse = 0;
        for (int i = 0; i < n; i++) {
            double predicted = intercept + slope * x[i];
            sse += Math.pow(y[i] - predicted, 2);
        }
        double mse = sse / (n - 2);
        double stdError = Math.sqrt(mse);

        // Gera pontos de projecao
        List<CostProjectionPoint> projections = new ArrayList<>();
        double lastX = x[n - 1];

        for (int day = 1; day <= projectionDays; day++) {
            double xFuture = lastX + day;
            double projected = intercept + slope * xFuture;

            if (projected < 0) {
                projected = 0;
            }

            // Intervalo de confianca de 95% (z = 1.96)
            double margin = 1.96 * stdError * Math.sqrt(1 + 1.0 / n + Math.pow(xFuture - sumX / n, 2) / (sumX2 - sumX * sumX / n));

            double lower = Math.max(0, projected - margin);
            double upper = projected + margin;

            projections.add(new CostProjectionPoint(
                    firstDate.plusDays((long) xFuture),
                    Math.round(projected * 100.0) / 100.0,
                    Math.round(lower * 100.0) / 100.0,
                    Math.round(upper * 100.0) / 100.0
            ));
        }

        return projections;
    }
}
