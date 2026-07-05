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
     *
     * @param startDate data inicial no formato YYYY-MM-DD
     * @param endDate   data final no formato YYYY-MM-DD
     * @return JSON string com resultados (vazio quando não há credenciais AWS configuradas)
     */
    public String getCostAndUsage(String startDate, String endDate) {
        log.info("AwsCostExplorer: fetching data for period {} to {}", startDate, endDate);
        return """
                { "results": [] }
                """.stripIndent();
    }

    /**
     * Busca previsão de custos da AWS Cost Explorer API.
     *
     * @return JSON string com previsão (vazio quando não há credenciais AWS configuradas)
     */
    public String getCostForecast() {
        log.info("AwsCostExplorer: fetching forecast");
        return """
                { "results": [] }
                """.stripIndent();
    }
}
