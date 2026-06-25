package com.cloudbuilder.cost.domain.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AwsCostExplorerService {

    private static final Logger log = LoggerFactory.getLogger(AwsCostExplorerService.class);

    private final RestTemplate restTemplate;

    public AwsCostExplorerService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Busca dados de custo e uso da AWS Cost Explorer API.
     * Atualmente retorna dados mockados como placeholder.
     *
     * @param startDate data inicial no formato YYYY-MM-DD
     * @param endDate   data final no formato YYYY-MM-DD
     * @return JSON string com resultados mockados
     */
    public String getCostAndUsage(String startDate, String endDate) {
        log.info("AwsCostExplorer: fetching data for period {} to {}", startDate, endDate);
        return """
                { "results": [
                    { "date": "%s", "amount": 1250.45, "service": "EC2", "currency": "USD" },
                    { "date": "%s", "amount": 980.20, "service": "S3", "currency": "USD" },
                    { "date": "%s", "amount": 340.10, "service": "RDS", "currency": "USD" }
                ]}
                """.formatted(startDate, endDate, endDate).stripIndent();
    }

    /**
     * Busca previsão de custos da AWS Cost Explorer API.
     * Atualmente retorna dados mockados como placeholder.
     *
     * @return JSON string com previsão mockada
     */
    public String getCostForecast() {
        log.info("AwsCostExplorer: fetching forecast");
        return """
                { "results": [
                    { "period": "next_month", "predictedAmount": 3200.00, "lowerBound": 2800.00, "upperBound": 3600.00 },
                    { "period": "next_quarter", "predictedAmount": 9600.00, "lowerBound": 8500.00, "upperBound": 10800.00 }
                ]}
                """.stripIndent();
    }
}
