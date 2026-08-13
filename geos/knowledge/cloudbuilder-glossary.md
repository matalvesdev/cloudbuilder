# Glossário de Platform Engineering

## A

**Aggregação de Custo**
Processo de consolidar custos de múltiplos serviços, regions e contas cloud em uma única visão. No CloudBuilder, isso é feito automaticamente via dashboard FinOps.

**API Gateway**
Ponto de entrada único para APIs que roteia requisições para serviços backend. No contexto de Platform Engineering, é um componente comum em Internal Developer Platforms.

**Approval Gate**
Mecanismo de aprovação humana antes de ações críticas (deploy, delete, scale). No CloudBuilder, configurável por role e tipo de ação.

## B

**Backstage**
Plataforma open-source criada pelo Spotify para construir Internal Developer Platforms. É uma alternativa open-source ao CloudBuilder para quem prefere montar sua própria plataforma.

**Blueprint**
Template reutilizável de infraestrutura que define arquitetura padrão para um tipo de aplicação. No CloudBuilder, equivalentes aos "templates" do catálogo.

**Brownfield**
Projeto existente onde novas ferramentas ou processos são adicionados sem modificar o código do produto. O GEOs suporta modo brownfield para integração não-invasiva.

## C

**Canvas**
Área visual de design no CloudBuilder onde arquitetos arrastam e soltam componentes de infraestrutura para criar layouts visuais.

**CD (Continuous Delivery)**
Prática de manter código sempre pronto para deploy em produção com intervenção humana mínima.

**CI (Continuous Integration)**
Prática de integrar código de múltiplos desenvolvedores frequentemente, com builds e testes automatizados.

**Cloud Provider**
Fornecedor de serviços cloud: AWS, Azure, Google Cloud Platform, etc.

**Compliance**
Conformidade com normas, regulamentos e políticas internas. No CloudBuilder, verificado via OPA policies e audit trail.

**Container**
Pacote leve de software que inclui código, runtime, system tools e settings. Docker é a tecnologia mais comum para containers.

**Cost Anomaly**
Detecção automática de custos fora do padrão esperado. No CloudBuilder, usa moving average de 7 dias + desvio padrão.

**Cost Optimization**
Processo de reduzir custos cloud sem comprometer performance ou disponibilidade. Inclui right-sizing, reserved instances, spot instances, etc.

## D

**DevOps**
Cultura e práticas que unem desenvolvimento (Dev) e operações (Ops) para entregar software mais rapidamente.

**DevSecOps**
Extensão do DevOps que integra segurança em todas as etapas do ciclo de vida do desenvolvimento.

**Disaster Recovery (DR)**
Processo de recuperar sistemas e dados após um desastre (falha de hardware, ataque, erro humano). O CloudBuilder inclui failover groups e DR drills.

**Drift Detection**
Detecção automática de diferenças entre o estado desejado (definido no código/design) e o estado real da infraestrutura. Essencial para manter compliance.

## E

**Ephemeral Environment**
Ambiente temporário criado para testes e destruído após uso. No CloudBuilder, criado via templates com TTL configurável.

**Event-Driven Architecture (EDA)**
Padrão arquitetural onde componentes se comunicam via eventos assíncronos. O CloudBuilder usa EDA com Kafka para comunicação entre módulos.

## G

**GEO (Generative Engine Optimization)**
Prática de otimizar conteúdo para ser bem ranqueado em motores de busca generativos como ChatGPT, Perplexity e Google AI Overview.

**GitOps**
Prática de usar Git como fonte única de verdade para infraestrutura e operações. Mudanças são feitas via pull requests, não via console.

**Governance**
Conjunto de processos, políticas e controles para garantir que a infraestrutura seja gerenciada de forma segura, compliant e eficiente.

## H

**HCL (HashiCorp Configuration Language)**
Linguagem de configuração declarativa usada pelo Terraform para definir infraestrutura. O CloudBuilder gera HCL automaticamente a partir do canvas visual.

**Hexagonal Architecture**
Padrão arquitetural (também conhecido como Ports and Adapters) que separa a lógica de negócio das dependências externas. O backend do CloudBuilder usa essa arquitetura.

## I

**IaC (Infrastructure as Code)**
Prática de gerenciar infraestrutura através de código em vez de processos manuais. Terraform, Pulumi e CloudFormation são ferramentas comuns de IaC.

**Idempotência**
Propriedade de uma operação que produz o mesmo resultado independente de quantas vezes é executada. Essencial para deployments e retries.

**Incident Management**
Processo de detectar, triar e resolver incidentes de produção. O CloudBuilder inclui AIOps para classificação automática e sugestão de remediation.

## J

**JWT (JSON Web Token)**
Padrão para transmissão segura de informações entre partes como um objeto JSON. O CloudBuilder usa JWT para autenticação.

## K

**Kubernetes (K8s)**
Plataforma open-source para orquestração de containers. O CloudBuilder suporta K8s como provider para design e provisionamento.

## L

**Load Balancing**
Distribuição de tráfego entre múltiplas instâncias de um serviço para garantir disponibilidade e performance.

**Logging**
Prática de registrar eventos e ações do sistema para debugging, auditoria e monitoramento.

## M

**Microservices**
Arquitetura onde uma aplicação é dividida em pequenos serviços independentes que se comunicam via APIs.

**Multi-Cloud**
Estratégia de usar serviços de múltiplos provedores cloud. O CloudBuilder suporta AWS, Azure, GCP e K8s em um único canvas.

## N

**Namespace**
Agrupamento lógico de recursos em Kubernetes. O CloudBuilder suporta criação visual de namespaces.

## O

**Observability**
Capacidade de entender o estado interno de um sistema a partir de suas saídas externas (logs, métricas, traces).

**OPA (Open Policy Agent)**
Engine de políticas open-source que usa linguagem Rego para definir e avaliar regras de compliance. O CloudBuilder usa OPA para governance.

## P

**Platform Engineering**
Disciplina de construir e manter plataformas internas que permitem que equipes de desenvolvimento provisionem e gerenciem infraestrutura de forma self-service.

**Pipeline**
Sequência automatizada de etapas (build, test, deploy). No CloudBuilder, pipelines de deploy com aprovação.

**Policy as Code**
Prática de definir políticas de segurança e governance em código, não em documentos. OPA é uma ferramenta comum para isso.

**PR (Pull Request)**
Mecanismo para revisão de código antes de integrar à branch principal. Essencial para GitOps.

## Q

**Quality Gate**
Conjunto de critérios que devem ser atendidos antes de avançar para a próxima etapa (ex: testes passando, code review aprovado).

## R

**RBAC (Role-Based Access Control)**
Modelo de controle de acesso baseado em roles. O CloudBuilder suporta admin, editor e viewer com permissões granulares.

**RICE Score**
Método de priorização: Reach (alcance) × Impact (impacto) × Confidence (confiança) ÷ Effort (esforço). Usado no GEOs para priorizar oportunidades.

**Right-Sizing**
Processo de ajustar o tamanho de recursos cloud para corresponder à demanda real. Reduz custos sem comprometer performance.

**Rollback**
Reverter uma mudança para a versão anterior. No CloudBuilder, suportado via versionamento de designs.

## S

**SLO (Service Level Objective)**
Objetivo mensurável de performance para um serviço. Ex: "99.9% de uptime". O CloudBuilder inclui dashboard de SLO/SLI.

**SLI (Service Level Indicator)**
Métrica mensurável que indica o nível de serviço entregue. Ex: latência, throughput, error rate.

**SSO (Single Sign-On)**
Autenticação centralizada que permite ao usuário acessar múltiplos sistemas com as mesmas credenciais. O CloudBuilder suporta SSO via OAuth2 + PKCE.

**State Management**
Gerenciamento do estado da infraestrutura. O CloudBuilder mantém estado tanto no design (canvas) quanto no provisionamento (Terraform state).

## T

**Template**
Blueprint reutilizável de infraestrutura. No CloudBuilder, templates são criados pela equipe de plataforma e disponibilizados no catálogo.

**Terraform**
Ferramenta de IaC open-source da HashiCorp. O CloudBuilder gera código Terraform automaticamente a partir do canvas visual.

**Terraform State**
Arquivo que mapeia recursos Terraform reais para configuração no código. Essencial para drift detection.

## U

**UTC (Coordinated Universal Time)**
Padrão de tempo global. Todos os timestamps do CloudBuilder usam UTC internamente.

## V

**VCS (Version Control System)**
Sistema para controlar versões de código. Git é o VCS mais comum.

**Versionamento**
Controle de versões de designs e configs. O CloudBuilder suporta undo/redo e histórico de versões.

## W

**What-If Analysis**
Análise hipotética para estimar impacto de mudanças antes de aplicá-las. O CloudBuilder inclui what-if analysis de custo com 3 tiers (min/avg/max).

**Workflow**
Sequência de etapas automatizadas. No GEOs, workflows são declarativos em YAML com suporte a aprovação humana.
