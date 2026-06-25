package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.CostForecast;
import com.cloudbuilder.cost.domain.port.CostForecastRepository;
import com.cloudbuilder.cost.domain.port.CostRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CostForecastService {

    private static final Logger log = LoggerFactory.getLogger(CostForecastService.class);

    private final CostForecastRepository costForecastRepository;
    private final CostRecordRepository costRecordRepository;

    public CostForecastService(CostForecastRepository costForecastRepository,
                               CostRecordRepository costRecordRepository) {
        this.costForecastRepository = costForecastRepository;
        this.costRecordRepository = costRecordRepository;
    }

    /**
     * Gera uma previsão simples baseada na média dos últimos 30 dias
     * e projeta para o período especificado.
     */
    public CostForecast generateForecast(String tenantId, String environmentId, String period) {
        var today = LocalDate.now();
        var startDate = today.minusDays(30);

        var totalCost = costRecordRepository.findTotalCostInRange(environmentId, startDate, today);
        double dailyAverage = totalCost != null ? totalCost / 30.0 : 0;

        double predictedAmount;
        int periodDays;

        switch (period.toUpperCase()) {
            case "MONTHLY" -> periodDays = 30;
            case "QUARTERLY" -> periodDays = 90;
            case "YEARLY" -> periodDays = 365;
            default -> periodDays = 30;
        }

        predictedAmount = dailyAverage * periodDays;

        // Intervalo de confiança simples: +/- 20%
        double lowerBound = Math.round(predictedAmount * 0.8 * 100.0) / 100.0;
        double upperBound = Math.round(predictedAmount * 1.2 * 100.0) / 100.0;
        predictedAmount = Math.round(predictedAmount * 100.0) / 100.0;

        var forecast = new CostForecast(
                tenantId, environmentId, predictedAmount, lowerBound, upperBound,
                period, "MOVING_AVERAGE", LocalDateTime.now()
        );

        log.info("CostForecastService.generateForecast: tenantId={}, environmentId={}, "
                + "period={}, predictedAmount={}, lowerBound={}, upperBound={}",
                tenantId, environmentId, period, predictedAmount, lowerBound, upperBound);

        return costForecastRepository.save(forecast);
    }

    @Transactional(readOnly = true)
    public Optional<CostForecast> getLatestForecast(String tenantId) {
        var forecasts = costForecastRepository.findLatestByTenantId(tenantId);
        if (forecasts.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(forecasts.get(0));
    }

    @Transactional(readOnly = true)
    public List<CostForecast> getForecastsByEnvironment(String tenantId, String environmentId) {
        return costForecastRepository.findByTenantIdAndEnvironmentId(tenantId, environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<CostForecast> findById(String id) {
        return costForecastRepository.findById(id);
    }
}
