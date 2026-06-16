package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.Incident;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AIService {

    private static final Map<String, String> RCA_TEMPLATES = Map.of(
        "critical", "Possível falha de infraestrutura subjacente. Verificar disponibilidade do provedor de nuvem, "
            + "status de rede e recursos críticos como bancos de dados e balanceadores de carga.",
        "warning", "Degradação de performance detectada. Pode estar relacionada a picos de tráfego, "
            + "alocação insuficiente de recursos ou contenção em recursos compartilhados.",
        "info", "Evento informacional. Monitorar para identificar padrões que possam indicar "
            + "problemas futuros."
    );

    private static final Map<String, String> CLASSIFICATION_TEMPLATES = Map.of(
        "infra", "infraestrutura",
        "network", "rede",
        "security", "segurança",
        "app", "aplicação",
        "database", "banco de dados",
        "default", "geral"
    );

    public String analyzeIncident(Incident incident) {
        var rca = RCA_TEMPLATES.getOrDefault(incident.getSeverity(),
            "Análise não conclusiva. Revisar logs e métricas para identificar a causa raiz.");
        return rca;
    }

    public String classifyIncident(String description) {
        var desc = description.toLowerCase();
        if (desc.contains("rede") || desc.contains("network") || desc.contains("conexão")) {
            return CLASSIFICATION_TEMPLATES.get("network");
        }
        if (desc.contains("segurança") || desc.contains("security") || desc.contains("auth") || desc.contains("acesso")) {
            return CLASSIFICATION_TEMPLATES.get("security");
        }
        if (desc.contains("banco") || desc.contains("database") || desc.contains("sql") || desc.contains("query")) {
            return CLASSIFICATION_TEMPLATES.get("database");
        }
        if (desc.contains("app") || desc.contains("aplicação") || desc.contains("serviço")) {
            return CLASSIFICATION_TEMPLATES.get("app");
        }
        if (desc.contains("infra") || desc.contains("servidor") || desc.contains("instância")) {
            return CLASSIFICATION_TEMPLATES.get("infra");
        }
        return CLASSIFICATION_TEMPLATES.get("default");
    }

    public String answerQuery(String question, String context) {
        var q = question.toLowerCase();
        if (q.contains("incidente") || q.contains("alerta")) {
            return "Foram detectados " + context + " incidente(s) ativo(s). "
                + "Recomendo revisar os incidentes de severidade crítica primeiro.";
        }
        if (q.contains("custo") || q.contains("economia") || q.contains("otimização")) {
            return "Com base na análise atual, identifiquei oportunidades de otimização de custos. "
                + "Recursos subutilizados podem ser redimensionados para reduzir despesas.";
        }
        if (q.contains("saúde") || q.contains("health") || q.contains("status")) {
            return "A saúde geral da infraestrutura está estável. "
                + "Nenhum problema crítico detectado no momento.";
        }
        return "Com base nos dados disponíveis, não foi possível determinar uma resposta específica. "
            + "Por favor, forneça mais detalhes sobre sua consulta.";
    }
}
