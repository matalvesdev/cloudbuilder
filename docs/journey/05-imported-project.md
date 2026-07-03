# Projeto Importado

## Project Summary

```mermaid
flowchart TB
    Imported[Projeto Importado]
    Summary[Resumo]

    Summary --> Tech[Tecnologias]
    Summary --> Arch[Arquitetura]
    Summary --> Deps[Dependências]
    Summary --> Infra[Infraestrutura]
    Summary --> Issues[Problemas]
    Summary --> AIRec[Recomendações IA]
    Summary --> MigrationPlan[Plano de Migração]
    Summary --> Provision[Provisionamento]

    Imported --> Summary
```

## Dashboard Terminal

```
+------------------------------------------------------------------+
| CloudBuilder                                                     |
+------------------------------------------------------------------+
| Projeto: cloudbuilder-api                                        |
| Branch: main                                                     |
| Ambiente: Production                                             |
+------------------------------------------------------------------+
| ✔ Arquitetura Detectada                                          |
| ✔ Kubernetes Detectado                                           |
| ✔ Docker Detectado                                               |
| ✔ Terraform Detectado                                            |
| ✔ GitHub Actions Detectado                                       |
| ✔ Observabilidade Detectada                                      |
+------------------------------------------------------------------+
| Recomendações da IA                                              |
| • Migrar Deployment para ArgoCD                                  |
| • Adicionar HPA                                                   |
| • Habilitar OpenTelemetry                                         |
| • Criar Redis Cache                                               |
| • Aplicar Naming Convention                                       |
+------------------------------------------------------------------+
| [Provisionar] [Gerar Terraform] [Deploy] [Abrir Canvas]          |
+------------------------------------------------------------------+
```
