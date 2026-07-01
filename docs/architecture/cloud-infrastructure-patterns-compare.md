# Cloud Infrastructure Patterns — Competitive Analysis

**Data**: 2026-06-24
**Framework**: FAANg (Research → Analysis → Synthesis → Roadmap)
**Autores**: Cloud Native Agent + Principal Architect

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Datadog Agent](#2-datadog-agent)
3. [Grafana Agent / Alloy](#3-grafana-agent--alloy)
4. [Dynatrace OneAgent](#4-dynatrace-oneagent)
5. [New Relic Infrastructure Agent](#5-new-relic-infrastructure-agent)
6. [Tabela Comparativa: Agentes de Monitoramento](#6-tabela-comparativa-agentes-de-monitoramento)
7. [HCP Terraform / Terraform Cloud](#7-hcp-terraform--terraform-cloud)
8. [Pulumi Cloud](#8-pulumi-cloud)
9. [Crossplane](#9-crossplane)
10. [Tabela Comparativa: Plataformas IaC](#10-tabela-comparativa-plataformas-iac)
11. [Padrões Arquiteturais Comuns](#11-padroes-arquiteturais-comuns)
12. [Roadmap Priorizado para CloudBuilder](#12-roadmap-priorizado-para-cloudbuilder)
13. [Recomendações Arquiteturais](#13-recomendacoes-arquiteturais)
14. [Referências](#14-referencias)

---

## 1. Resumo Executivo

Este documento analisa a arquitetura de 7 plataformas concorrentes/complementares ao CloudBuilder, divididas em duas categorias:

**Agentes de Monitoramento de Infraestrutura**: Datadog, Grafana/Alloy, Dynatrace, New Relic — como coletam dados com mínimo overhead, descobrem recursos automaticamente, e suportam multi-cloud.

**Plataformas de Infraestrutura como Código**: HCP Terraform, Pulumi Cloud, Crossplane — como gerenciam recursos multi-cloud, estado, drift, e governança.

### Descobertas Principais

| Padrão | Ocorrências | Aplicação CloudBuilder |
|--------|-------------|----------------------|
| Component-based architecture | Datadog (Fx), Grafana (Flow), Crossplane (Functions) | Go engine modular |
| eBPF para visibilidade sistêmica | Datadog (system-probe), Dynatrace (indireto) | Monitoramento nativo |
| Kubernetes Cluster Agent | Datadog, Dynatrace (Operator), New Relic (Flux) | Cluster-level cache |
| Auto-discovery declarativo | Todos os 4 agentes | Autodiscovery de recursos no canvas |
| Topologia automática | Dynatrace (Smartscape), Datadog (Resource Catalog) | Service Map existente |
| OpenTelemetry first-class | Datadog, Grafana, New Relic | Adoção OTel como padrão |
| Multi-modal monitoring | Todos (full-stack/infra/discovery tiers) | Tiers de monitoramento |
| GitOps para agentes | New Relic (Flux), Grafana | Declarativo + convergente |
| DAG pipeline | Grafana (Flow), Crossplane (Composition) | Pipeline de provisionamento |
| Language-native IaC | Pulumi, CDKTF | Automation API |

---

## 2. Datadog Agent

### 2.1 Arquitetura do Agente

Datadog Agent (v6/v7) é um sistema **multi-processo modular** escrito em Go (~7.80.0, Jun 2026):

```
┌────────────────────────────────────────────────────────┐
│                    DATADOG AGENT                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Core Agent  │  │ Process Agent│  │  Trace Agent │  │
│  │  (collector  │  │ (processes   │  │  (APM,       │  │
│  │   +forwarder │  │  +container) │  │   traces)    │  │
│  │   +DogStatsD)│  │              │  │              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  │
│  │ System-Probe │  │Security Agent│  │  OTEL Agent  │  │
│  │ (eBPF probes)│  │ (CWS +       │  │ (OTel        │  │
│  │              │  │  compliance) │  │  collector)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Componentes principais**:
- **Core Agent**: Collector (checks a cada 15s), Forwarder (HTTPS), DogStatsD (UDP)
- **Cluster Agent**: Kubernetes cluster-level (cache, HPA, admission controller)
- **System Probe**: eBPF para rede, segurança, e rastreamento de processos
- **Process Agent**: Live process/container monitoring
- **OTEL Agent**: Built-in OpenTelemetry Collector

**Técnicas de minimização de overhead**:
- Buffer em memória com discard LRU para evitar vazamento
- Compressão de payloads antes do envio
- Go linker otimizations (77% redução de binário entre 7.60.0 e 7.68.0)
- Build tags para incluir/excluir funcionalidades por plataforma
- "Infrastructure modes" (basic, none, end_user_device) para cenários específicos

### 2.2 Descoberta de Infraestrutura

**Resource Catalog**: Catálogo central de recursos via cloud integrations + Agent.
- Snapshot Changes a cada 5-15 min para detectar alterações de configuração
- Schema de recursos normalizado para AWS/Azure/GCP
- Superset de 700+ resource types no schema

**Autodiscovery (containerizado)**:
- Agent monitora eventos de container (create/destroy/start/stop)
- Templates de configuração com variáveis substituídas automaticamente
- Suporte a Kubernetes annotations, Docker labels, ConfigMap, key-value stores
- Auto-configuração para serviços comuns (Apache, Redis)

### 2.3 Multi-Cloud

- **AWS**: Cloud integration turnkey (60+ serviços: EC2, RDS, Lambda, ELB, S3, etc.)
- **Azure**: Azure Native integration via Datadog resource provider
- **GCP**: GCP integration via service accounts
- **Alibaba Cloud**: Suporte adicional
- **Tag universal**: Tagging cross-provider para correlação

### 2.4 Kubernetes

- **Node Agent** (DaemonSet): coleta métricas locais por nó
- **Cluster Agent** (Deployment): cache de metadados cluster-level, reduz carga no API server
- **HPA via external metrics**: Cluster Agent expõe métricas customizadas para autoscaling
- **Admission Controller**: validação/injeção de configuração via webhook
- **Orchestrator Explorer**: visão de deployments, services, pods, etc.
- **Argo Rollouts**: suporte a canary deployments via DatadogPodAutoscalerClusterProfile

### 2.5 Rede e Containers

- **CNM (Cloud Network Monitoring)**: eBPF para flow logs, packet capture, service maps
- **Universal Service Monitoring**: TLS uprobes para mapear serviços sem APM
- **Container monitoring**: Docker, containerd, CRI-O via socket discovery
- **Serverless**: Lambda layers para AWS Lambda, Cloud Functions, Azure Functions

### 2.6 Ecossistema de Integrações

- **1000+ integrações** out-of-the-box
- **600+** contribuições open source
- **OTLP Receiver**: OpenTelemetry nativo no Agent
- **Fleet Automation**: gerenciamento remoto de agents em escala

---

## 3. Grafana Agent / Alloy

### 3.1 Arquitetura

Grafana Agent Flow (agora **Grafana Alloy** — EOL Nov 2025) é uma **distribuição do OpenTelemetry Collector** com pipeline programável:

```
┌────────────────────────────────────────────────────────────┐
│                  GRAFANA ALLOY (ex-Agent Flow)              │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Component Controller                    │      │
│  │  (DAG-based scheduler + health + evaluation)      │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ discovery │  │ prometheus│  │   loki    │              │
│  │ .k8s      │──│ .scrape   │──│ .process  │              │
│  └───────────┘  └───────────┘  └───────────┘              │
│       │                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ discovery │  │   otelcol │  │  local    │              │
│  │ .kubelet  │──│ .receiver │──│ .file     │              │
│  └───────────┘  └───────────┘  └───────────┘              │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │      River Config Language (Terraform-inspired)   │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

**Inovações chave**:
- **Componentes**: blocos reutilizáveis (single task, narrow scope)
- **River**: linguagem declarativa similar a HCL, com first-class functions
- **DAG**: controlador avalia componentes em ordem topológica
- **In-memory traffic**: comunicação entre componentes sem overhead de rede
- **Clustering**: distribuição de carga entre múltiplos agents

### 3.2 Deployment

- **Centralizado** (StatefulSet): para coleta de métricas de aplicação (~10KB/series, ~1M series antes de horizontal scaling)
- **DaemonSet** (host daemon): para métricas de nó (node_exporter, cAdvisor, logs)
- **Sidecar**: para aplicações de curta duração

### 3.3 Kubernetes Discovery

- `discovery.kubernetes`: roles para node, pod, service, endpoints, endpointslice, ingress
- `discovery.kubelet`: descoberta via Kubelet API (/pods endpoint)
- `prometheus.operator.probes`: descoberta via Prometheus Operator CRDs
- Selectors para filtrar recursos por labels/namespaces

### 3.4 Ecossistema

- **OpenTelemetry-native**: centenas de componentes OTel
- **Prometheus**: first-class para métricas
- **Loki**: first-class para logs
- **Tempo**: tracing distribuído
- **Component controller**: health reporting, debug UI, reload sem restart

---

## 4. Dynatrace OneAgent

### 4.1 Arquitetura

OneAgent opera em **3 modos de monitoramento**, cada um com trade-off diferente de profundidade vs. overhead:

```
┌─────────────────────────────────────────────────────────┐
│                 DYNATRACE ONEAGENT                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              OneAgent Core                       │    │
│  │  (comunicação com cluster, status, health check) │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Full-Stack  │  │Infrastructure│  │  Discovery   │  │
│  │  (code-level │  │(host metrics │  │ (basic       │  │
│  │   visibility,│  │ + process    │  │  metrics,    │  │
│  │   traces,    │  │ injection,   │  │  auto-       │  │
│  │   profiling) │  │ JMX/PMI)     │  │  discovery)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Process Injection (Java, .NET, Node.js, Go,    │    │
│  │   PHP, Web Servers)                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Smartscape (Auto-topology + Davis AI)           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Modos de Monitoramento

| Componente | Full Stack | Infrastructure | Discovery |
|------------|:----------:|:--------------:|:---------:|
| Topologia Smartscape | ✅ | ✅ | ✅ |
| Host health, filesystem | ✅ | ✅ | ✅ |
| Process injection | opt-out | opt-in | ❌ |
| Tracing & profiling | ✅ | ❌ | ❌ |
| Log management | opt-in | opt-in | opt-in |
| Custom metrics | 15/256MiB | 100/host | ❌ |
| Application Security | opt-in | opt-in | opt-in |

**Estratégia Discovery → Infra → Full Stack**: Recomendação é implantar Discovery em todo o parque (baixo custo), Infrastructure em sistemas críticos, e Full-Stack em aplicações de negócio.

### 4.3 Kubernetes

- **Dynatrace Operator** (DynaKube): gerencia ciclo de vida do OneAgent no K8s
- **CSI Driver**: cache de code modules (overlayfs) para minimizar banda e disco
- **Modos**: classicFullStack, applicationMonitoring, hostMonitoring, cloudNativeFullStack
- **ActiveGate**: roteamento de dados para o cluster Dynatrace

### 4.4 Smartscape (Topologia)

**Diferencial competitivo mais significativo**:
- Descoberta automática de toda a stack em <5 minutos (sem configuração manual)
- Grafo de dependências em tempo real (serviços → processos → hosts → rede)
- Davis AI para baseline automático e detecção de anomalias
- Até 4.000 nós / 10.000 arestas por visualização
- Segments para filtrar por hyperscaler account, time, workload
- Visões específicas: AWS EC2, Kubernetes, Infraestrutura, All topology

### 4.5 Multi-Cloud

- **AWS**: EC2, RDS, Lambda, ECS, EKS, ELB — mapeamento automático via Smartscape
- **Azure**: VMs, AKS, CosmosDB, SQL Database — integração nativa
- **GCP**: Compute Engine, GKE, Cloud SQL, Cloud Functions
- **Hybrid**: On-prem + cloud no mesmo grafo de dependências

---

## 5. New Relic Infrastructure Agent

### 5.1 Arquitetura

```
┌────────────────────────────────────────────────────────┐
│             NEW RELIC INFRASTRUCTURE AGENT              │
│                                                        │
│  ┌──────────────┐    ┌──────────────────────┐          │
│  │ newrelic-infra│    │  newrelic-infra-     │          │
│  │ -service     │───▶│  (main process)      │          │
│  │ (supervisor) │    │  ┌────────────────┐  │          │
│  └──────────────┘    │  │ Plugin Manager │  │          │
│                       │  │ - inventory    │  │          │
│  ┌──────────────┐    │  │ - samplers     │  │          │
│  │ Fluent Bit   │    │  │ - integrations │  │          │
│  │ (log fwd)    │    │  └────────────────┘  │          │
│  └──────────────┘    │  ┌────────────────┐  │          │
│                       │  │ StatsD (port   │  │          │
│  ┌──────────────┐    │  │  8001)         │  │          │
│  │ NRDOT (OTel) │    │  └────────────────┘  │          │
│  │ Collector    │    └──────────────────────┘          │
│  └──────────────┘                                      │
└────────────────────────────────────────────────────────┘
```

**Inovações**:
- **Agent Control**: supervisor multi-agent (infra + OTel + Fluent Bit) com GitOps via Flux
- **Fleet Control**: gerenciamento remoto centralizado (configuração declarativa como estado desejado)
- **NRDOT (New Relic Distribution of OpenTelemetry)**: OTel-first para infraestrutura
- **Hybrid Agents**: SDK New Relic + APIs OpenTelemetry simultaneamente

### 5.2 Container e Kubernetes

- **Containerized Agent**: Alpine-based, suporta containerd (K8s 1.24+) e dockerd
- **Kubernetes integration**: deploy via Helm, Agent Control + Flux para GitOps
- **Process metrics**: enableProcessMetrics para visibilidade de processos

### 5.3 Multi-Cloud

- AWS, Azure, GCP: detecção automática de cloud type e metadata
- **Cloud integrations**: enriquecimento de métricas com tags e metadados estendidos
- **Infra NRDOT**: dashboards e entidades prontas para infra OTel-native

---

## 6. Tabela Comparativa: Agentes de Monitoramento

### 6.1 Arquitetura do Agente

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **Linguagem** | Go (+ Python checks) | Go | C++/Go | Go |
| **Arquitetura** | Multi-processo (Fx DI) | Componentes (DAG) | Mono + injection | Supervisor + plugins |
| **Config** | datadog.yaml + env | River (HCL-like) | CLI + UI + API | YAML + environment |
| **eBPF** | System Probe nativo | ❌ (via OTel) | Indireto (kernel) | ❌ |
| **Pipeline** | Collector→Forwarder | DAG de componentes | Agent→ActiveGate | Plugin manager |
| **Overhead típico** | ~2-5% CPU, ~200MB RAM | ~1-3% CPU, ~100MB RAM | ~3-8% CPU, ~300MB RAM | ~1-3% CPU, ~80MB RAM |
| **OTel support** | Built-in OTLP receiver | Distribuição OTel | ❌ (nativo) | NRDOT (distribuição) |
| **Open Source** | ✅ (core) | ✅ | ❌ | ✅ (core) |

### 6.2 Descoberta e Topologia

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **Auto-discovery** | Template-based (annotations + labels) | Component discovery.k8s | Smartscape automático | Cloud type detection |
| **Resource catalog** | ✅ Resource Catalog (700+ types) | ❌ | ✅ Smartscape | ❌ |
| **Snapshot changes** | ✅ a cada 5-15min | ❌ | ✅ (Davis AI compara) | ❌ |
| **Topology graph** | Map (host/container) | ❌ | Smartscape (4K nodes) | ❌ |
| **Time to discovery** | ~30s-2min | ~10s-30s | <5min completo | ~6s startup |

### 6.3 Suporte Multi-Cloud

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **AWS** | ✅ 60+ serviços | ✅ (via exporters) | ✅ Smartscape | ✅ cloud integrations |
| **Azure** | ✅ Native integration | ✅ | ✅ Smartscape | ✅ |
| **GCP** | ✅ | ✅ | ✅ | ✅ |
| **Alibaba** | ✅ | ❌ | ❌ | ❌ |
| **Tags cross-cloud** | ✅ Universal tagging | ❌ | ✅ Segments | ✅ Cloud metadata |
| **Natural language query** | ✅ Resource Catalog NL | ❌ | ❌ | ❌ |

### 6.4 Kubernetes

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **Deploy** | DaemonSet + Cluster Agent | DaemonSet/StatefulSet | Operator (DynaKube) | Agent Control + Flux |
| **Cluster cache** | Cluster Agent | ❌ | Dynatrace Operator | ❌ |
| **HPA integration** | ✅ External Metrics | ❌ | ❌ | ❌ |
| **Admission controller** | ✅ | ❌ | ✅ (webhook injection) | ❌ |
| **Argo Rollouts** | ✅ | ❌ | ❌ | ❌ |
| **CSI driver** | ❌ | ❌ | ✅ (code module cache) | ❌ |
| **Pod security** | ✅ via Security Agent | ❌ | ✅ Application Security | ❌ |

### 6.5 Rede e Serverless

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **Network monitoring** | eBPP (CNM) | ❌ | ✅ Network analysis | ❌ |
| **Service maps** | ✅ USM (TLS uprobes) | ❌ | ✅ Smartscape | ❌ |
| **Lambda** | ✅ Lambda layers | ❌ | ✅ | ✅ |
| **Cloud Functions** | ✅ | ❌ | ✅ | ✅ |
| **Container runtimes** | Docker, containerd, CRI-O | Docker, containerd | Docker, containerd | Docker, containerd |

### 6.6 Ecossistema

| Aspecto | Datadog | Grafana/Alloy | Dynatrace | New Relic |
|---------|---------|---------------|-----------|-----------|
| **Integrações** | 1000+ | Centenas (OTel) | 600+ | 500+ |
| **Fleet management** | ✅ Fleet Automation | ❌ | ✅ ActiveGate | ✅ Fleet Control |
| **AI** | Watchdog + Forecasts | ❌ | ✅ Davis AI | ✅ New Relic AI |
| **Custos** | $$$$ | $$ (OSS) | $$$ | $$$ |

---

## 7. HCP Terraform / Terraform Cloud

### 7.1 Arquitetura

HCP Terraform é uma **plataforma de execução gerenciada para Terraform**:

```
┌────────────────────────────────────────────────────────────┐
│                   HCP TERRAFORM                             │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Workspaces  │  │   Stacks    │  │    Projects      │    │
│  │  (1 config = │  │ (repeatable │  │  (logical        │    │
│  │   1 infra)   │  │  modules)   │  │   isolation)     │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Run Environment                        │      │
│  │  (single-use Linux VMs, x86_64, disposable)      │      │
│  │  → Global queue → Worker VMs → Plan/Apply        │      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  State Mgr   │  │  Policy (    │  │  Registry    │      │
│  │  (remote,    │  │  Sentinel +  │  │  (private    │      │
│  │   versioned) │  │  OPA)        │  │  modules)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │            HCP Terraform Agents                   │      │
│  │  (on-prem/private infra execution)                │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

### 7.2 Funcionalidades Chave

| Funcionalidade | Descrição | Aplicação CloudBuilder |
|----------------|-----------|----------------------|
| **Workspaces** | Grupo isolado de recursos + state + vars | Já existe (environments) |
| **Stacks** | Deploy repetível de módulos multi-cloud | Novo conceito para CloudBuilder |
| **Remote state** | State versionado + locking + compartilhado | Melhorar state service |
| **Drift detection** | Contínuo + Continuous Validation | Já existe (drift store) |
| **Policy-as-code** | Sentinel + OPA | ADR-020 (proposto) |
| **VCS integration** | GitHub/GitLab/Bitbucket → auto-trigger | GitOps webhook existente |
| **Run environment** | Worker VM descartável, isolada por tenant | Equivalente: disposable containers |
| **CLI/API/UI** | Três workflows equivalentes | API-first (já adotado) |

### 7.3 Landing Zones

HCP Terraform suporta **Infrastructure Landing Zones** e **Application Landing Zones**:
- **AWS Landing Zone**: Hub-and-spoke VPC, account factory, SCPs
- **Azure Landing Zone**: Management groups, policy assignments, RBAC
- **GCP Landing Zone**: Folder hierarchy, VPC-SC, custom roles

Padrão: **Terraform provisiona a base → Crossplane dentro do cluster gerencia por equipe**

---

## 8. Pulumi Cloud

### 8.1 Arquitetura

```
┌───────────────────────────────────────────────────────────────┐
│                      PULUMI CLOUD                              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ Language Host │  │ Deployment   │  │ Resource         │     │
│  │ (TS, Python,  │──│ Engine       │──│ Providers        │     │
│  │  Go, C#, Java)│  │ (state diff) │  │ (AWS/Azure/GCP/  │     │
│  └──────────────┘  └──────────────┘  │  K8s/etc)         │     │
│                                       └──────────────────┘     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Pulumi Cloud (SaaS ou Self-Hosted)       │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │     │
│  │  │ State    │  │ Policies │  │ Insights         │    │     │
│  │  │ Backend  │  │ (Cross-  │  │ (inventory,      │    │     │
│  │  │          │  │  Guard)  │  │  search, copilot) │    │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │     │
│  │  │ ESC      │  │Deploy-   │  │ Review Stacks    │    │     │
│  │  │ (secrets │  │ments     │  │ (ephemeral env)  │    │     │
│  │  │ & config)│  │(managed) │  │                  │    │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘    │     │
│  └───────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
```

**Inovação central**: Infraestrutura como **código em linguagens de programação reais**, não DSL.

### 8.2 Multi-Cloud

- **Native providers**: AWS (mesmo dia para novos serviços), Azure, GCP
- **Ecosystem**: Cloudflare, Datadog, Auth0, GitHub, VMWare, OpenStack
- **Multi-language**: Mesmo padrão entre TypeScript, Python, Go, C#, Java, YAML
- **Component Resources**: Abstrações reutilizáveis (ex: `ShinyCluster` que deploya em qualquer cloud)

### 8.3 Diferenciais

| Funcionalidade | Descrição | Aplicação CloudBuilder |
|----------------|-----------|----------------------|
| **Automation API** | SDK para embutir IaC em apps (self-service, portals) ⭐ | **Alta prioridade** |
| **Pulumi ESC** | Secrets/Config como serviço gerenciado | Substitui gerenciamento de vars |
| **Pulumi Neo** | AI agent para IaC (debug, escrita, perguntas) | Similar ao AI Chat existente |
| **Drift Detection** | Automático + remediation via scheduled runs | Já existe (driftStore) |
| **Review Stacks** | Ephemeral environments por PR | Já existe (ephemeral) |
| **CrossGuard** | Policy-as-code (TS/Python/Go) | ADR-020 (proposto) |
| **Insights** | Resource inventory, search, analytics cross-cloud | Resource Catalog futuro |
| **Self-hosted** | On-prem Pulumi Cloud para compliance | Para enterprise |

### 8.4 Component Resources (Multi-Cloud Abstraction)

Pulumi permite criar abstrações multi-cloud via `ComponentResource`:

```typescript
class ShinyCluster extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    // Wrapper que funciona em AWS, Azure, GCP
    // Baseado em interfaces, implementações por provider
  }
}
```

Este padrão é **diretamente aplicável** à geração de código do CloudBuilder: um design visual deve poder gerar Terraform **OU** Pulumi **OU** Crossplane.

---

## 9. Crossplane

### 9.1 Arquitetura

Crossplane é um **framework de control plane K8s-native** para plataforma de engenharia:

```
┌─────────────────────────────────────────────────────────────┐
│                     CROSSPLANE                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Kubernetes Cluster                     │    │
│  │                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │ Composite    │  │ Provider     │  │ Provider │  │    │
│  │  │ Resource    │──│ AWS (Upjet)  │  │ Azure   │  │    │
│  │  │ (XR)        │  │ 700+ CRDs    │  │ 500+ CRDs│  │    │
│  │  └──────┬───────┘  └──────────────┘  └──────────┘  │    │
│  │         │                                           │    │
│  │  ┌──────┴───────┐  ┌──────────────┐  ┌──────────┐  │    │
│  │  │ Composition  │  │ Provider GCP │  │ Provider │  │    │
│  │  │ (template +  │──│ 400+ CRDs    │  │ K8s     │  │    │
│  │  │  functions)  │  └──────────────┘  └──────────┘  │    │
│  │  └──────────────┘                                   │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │  Package Manager (install providers + funcs) │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Conceitos Fundamentais

| Conceito | Descrição | Análogo em CloudBuilder |
|----------|-----------|------------------------|
| **Managed Resource (MR)** | CRD K8s que gerencia recurso cloud (ex: `Bucket`) | `ManagedResource` entity |
| **Composite Resource (XR)** | API custom que combina múltiplos MRs | Design canvas → múltiplos recursos |
| **Composition** | Template + pipeline de functions | Code generation template |
| **Composition Function** | gRPC function que retorna YAML declarativo | Go engine code generation |
| **Provider** | Package que adiciona CRDs + controller | Provider templates (AWS/Azure/GCP) |
| **Claim** | Namespaced XR (self-service para devs) | Self-service provisioning |
| **ProviderConfig** | Credentials multi-account por provider | Credential management |

### 9.3 Ecossistema de Providers

| Provider | Managed Resources | Destaque |
|----------|:-----------------:|----------|
| AWS (Upjet) | 700+ | S3, EC2, RDS, VPC, IAM, Lambda |
| Azure (Upbound) | 500+ | VM, AKS, CosmosDB, SQL, VNet |
| GCP (Upbound) | 400+ | GKE, Cloud SQL, VPC, IAM |
| Kubernetes | N/A | Manage K8s resources via K8s |
| Helm | N/A | Helm releases via Crossplane |
| Terraform | N/A | Bridge para Terraform providers |
| Databricks, GitLab, etc. | 50+ providers | Ecossistema crescente |

### 9.4 Composition Functions (Pipeline)

Crossplane v2.0+ introduziu **Composition Functions** como pipeline gRPC:
1. **YAML + CEL**: Template declarativo com Common Expression Language
2. **KCL**: Configuration language da KusionStack
3. **kro**: Resource graph syntax (similar ao kro OSS)
4. **Crossplane-contrib**: Functions em Go, Python, TypeScript

### 9.5 Padrão de Mercado

> **Terraform provisiona a base → Crossplane dentro do cluster gerencia por equipe**

Este padrão (identificado em múltiplas empresas) separa claramente:
- **Platform team**: Terraform para infraestrutura base (clusters, VPC, IAM)
- **Dev teams**: Crossplane para recursos por equipe (buckets, databases, queues)

---

## 10. Tabela Comparativa: Plataformas IaC

| Aspecto | HCP Terraform | Pulumi Cloud | Crossplane | CloudBuilder (atual) |
|---------|:-------------:|:------------:|:----------:|:--------------------:|
| **Linguagem** | HCL | TS/Python/Go/C#/Java | YAML + CEL | Canvas visual → HCL |
| **State mgmt** | Remote + versioned | SaaS ou self-hosted | K8s etcd | PostgreSQL |
| **Execution** | Worker VMs (disposable) | Client-side ou managed | K8s controllers | Go engine |
| **Multi-cloud** | ✅ Providers 2000+ | ✅ Native providers | ✅ 50+ providers | ✅ AWS/Azure/GCP/K8s |
| **Drift detection** | ✅ Continuous Val. | ✅ Scheduled | ✅ Controller loop | ✅ Drift detection |
| **Policy-as-code** | Sentinel + OPA | CrossGuard (TS/Python) | OPA (via provider) | OPA configurado |
| **Self-service** | Workspaces + teams | Automation API | XR Claims | Design canvas |
| **GitOps** | VCS-driven | Git Push to Deploy | ❌ (declarativo puro) | GitOps webhook |
| **AI** | ❌ | ✅ Pulumi Neo | ❌ | ✅ AI Chat + AIOps |
| **Ephemeral** | Workspaces | Review Stacks | ❌ | ✅ Ephemeral environments |
| **Secrets** | Vars (encrypted) | ESC (Vault, AWS, Azure) | ProviderConfig | Credential entity |
| **Open Source** | Core apenas | Core (SDK + CLI) | ✅ Completo | ❌ (proprietário) |
| **Self-hosted** | TFE (enterprise) | Self-hosted Pulumi Cloud | Nativo (K8s) | docker-compose |
| **Custo** | $$$$ | $$$ | $ (OSS) | MVP (self-hosted) |

---

## 11. Padrões Arquiteturais Comuns

### 11.1 Padrões de Agentes

| Padrão | Descrição | Onde Usam |
|--------|-----------|-----------|
| **Multi-process modular** | Processos independentes por função (metrics, traces, security) | Datadog, New Relic |
| **Component DAG pipeline** | Componentes conectados em grafo acíclico direcionado | Grafana/Alloy, Crossplane |
| **Plugin registry** | Sistema de plugins com registro central | Datadog (integrations), New Relic |
| **eBPF system probe** | Sonda de kernel para visibilidade sem instrumentação | Datadog (system-probe) |
| **Code injection** | Injeção de agente em processos para tracing profundo | Dynatrace (OneAgent) |
| **Supervisor pattern** | Processo pai gerencia ciclo de vida dos filhos | New Relic (agent-control) |
| **OTel distribution** | Distribuição customizada do OpenTelemetry Collector | Grafana/Alloy, New Relic (NRDOT) |
| **Declarative config** | Configuração declarativa vs. imperativa | Grafana (River), Crossplane (YAML) |

### 11.2 Padrões de IaC

| Padrão | Descrição | Onde Usam |
|--------|-----------|-----------|
| **State as source of truth** | Estado desejado vs. real | Terraform, Pulumi, Crossplane |
| **Controller reconciliation** | Loop contínuo de reconciliação | Crossplane, K8s controllers |
| **Provider plugin model** | Plugins por cloud provider | Terraform, Pulumi, Crossplane |
| **Composition abstraction** | Abstração composta de recursos | Crossplane (XR+Composition), Pulumi (ComponentResource) |
| **Policy-as-code gate** | Políticas executadas antes de cada operação | Terraform (Sentinel), Pulumi (CrossGuard) |
| **Ephemeral execution** | Ambiente descartável para cada run | Terraform (worker VMs) |
| **Automation API** | SDK programático para IaC | Pulumi (Automation API) |

### 11.3 Padrões de Multi-Tenancy

| Padrão | Descrição | Onde Usam |
|--------|-----------|-----------|
| **Workspace isolation** | Isolamento lógico por workspace | HCP Terraform, Pulumi |
| **ProviderConfig multi-account** | Múltiplas credenciais por provider | Crossplane |
| **Tag-based segmentation** | Segmentação por tags/taxonomia | Datadog, Dynatrace (Segments) |
| **Project hierarchy** | Organização hierárquica (org → project → workspace) | HCP Terraform, CloudBuilder |

---

## 12. Roadmap Priorizado para CloudBuilder

Com base na análise competitiva, as seguintes capacidades são priorizadas para CloudBuilder:

### Fase 1 — Fundação (Q3 2026) 🟢 Alta Prioridade

| # | Capacidade | Referência | Esforço | Impacto |
|---|-----------|------------|:-------:|:-------:|
| **1.1** | **Pipeline programável (DAG) no Go engine** — Componentes conectáveis para code generation | Grafana Flow, Crossplane Functions | 3 sprints | ⭐⭐⭐⭐⭐ |
| **1.2** | **State reconciliation loop** — Controller pattern para drift contínuo (não apenas sob demanda) | Crossplane, K8s controllers | 2 sprints | ⭐⭐⭐⭐⭐ |
| **1.3** | **Provider plugin SDK** — Interface padronizada para novos providers (não apenas AWS/Azure/GCP) | Terraform providers, Pulumi providers | 2 sprints | ⭐⭐⭐⭐ |
| **1.4** | **Agent Control centralizado** — Supervisor multi-agente com GitOps (Flux-based) | New Relic Agent Control | 3 sprints | ⭐⭐⭐⭐ |

### Fase 2 — Operações (Q3-Q4 2026) 🟡 Média Prioridade

| # | Capacidade | Referência | Esforço | Impacto |
|---|-----------|------------|:-------:|:-------:|
| **2.1** | **Resource Catalog multi-cloud** — Inventário unificado de recursos gerenciados (gerenciados + descobertos) | Datadog Resource Catalog, Pulumi Insights | 3 sprints | ⭐⭐⭐⭐⭐ |
| **2.2** | **Auto-discovery de recursos** — Detecção automática de recursos cloud não gerenciados pelo canvas | Datadog Autodiscovery, Dynatrace Smartscape | 4 sprints | ⭐⭐⭐⭐ |
| **2.3** | **Topology graph automático** — Mapa de dependências entre recursos (similar Smartscape) | Dynatrace Smartscape | 4 sprints | ⭐⭐⭐⭐ |
| **2.4** | **OpenTelemetry native pipeline** — CloudBuilder como distribuição OTel | Grafana Alloy, New Relic NRDOT | 2 sprints | ⭐⭐⭐ |
| **2.5** | **Policy-as-code executor** — OPA + regras customizáveis por projeto | HCP Sentinel, Pulumi CrossGuard | 2 sprints | ⭐⭐⭐⭐ |

### Fase 3 — Inteligência (Q4 2026) 🟠 Baixa Prioridade

| # | Capacidade | Referência | Esforço | Impacto |
|---|-----------|------------|:-------:|:-------:|
| **3.1** | **Automation API** — SDK para embutir CloudBuilder em apps (portais self-service, CI/CD custom) | Pulumi Automation API | 4 sprints | ⭐⭐⭐⭐⭐ |
| **3.2** | **eBPF visibility probes** — Sondas de kernel para monitoramento de rede e processos | Datadog system-probe | 5 sprints | ⭐⭐⭐ |
| **3.3** | **Snapshot changes tracking** — Histórico de alterações de configuração de recursos | Datadog Snapshot Changes | 2 sprints | ⭐⭐⭐ |
| **3.4** | **Crossplane integration** — CloudBuilder como provider Crossplane ou consumer de XRs | Crossplane provider-terraform | 3 sprints | ⭐⭐⭐ |
| **3.5** | **LLM auto-remediation** — AI agent que diagnostica e corrige drift automaticamente | Dynatrace Davis AI | 3 sprints | ⭐⭐⭐⭐ |

### Fase 4 — Enterprise (Q1 2027) 🔴 Nice-to-Have

| # | Capacidade | Referência | Esforço | Impacto |
|---|-----------|------------|:-------:|:-------:|
| **4.1** | **Self-hosted Crossplane control plane** — CloudBuilder como gerenciador de XR | Crossplane + Upbound | 4 sprints | ⭐⭐⭐ |
| **4.2** | **Fleet management em escala** — Gerenciamento de milhares de agents remotos | Datadog Fleet Automation, NR Fleet Control | 5 sprints | ⭐⭐⭐⭐ |
| **4.3** | **Landing zones templates** — Blueprints multi-account para AWS/Azure/GCP | HCP Terraform Landing Zones | 4 sprints | ⭐⭐⭐⭐ |
| **4.4** | **Compliance automations** — Regulamentação como código (SOC2, HIPAA, LGPD) | Crossplane + OPA + custom policies | 3 sprints | ⭐⭐⭐ |

---

## 13. Recomendações Arquiteturais

### 13.1 Para o Go Engine (Imediato)

1. **Adotar arquitetura DAG pipeline** — Substituir geração linear de código por pipeline de componentes conectáveis:
   ```
   Input (CanvasDesign) → Provider Router → Resource Mapper → Template Engine → HCL Formatter → Output (GeneratedCode)
   ```
   Cada etapa é um componente independente, testável, e substituível.

2. **Implementar componente de auto-discovery** — Agente Go que consulta APIs cloud e popula canvas com recursos existentes (similar Datadog Autodiscovery).

3. **Provider plugin SDK** — Interface Go para criar novos providers sem modificar o core:
   ```go
   type Provider interface {
       Name() string
       DiscoverResources(ctx context.Context) ([]*Resource, error)
       GenerateTemplates(resources []*Resource) ([]*Template, error)
       ValidateTemplate(template *Template) error
   }
   ```

### 13.2 Para o Backend Java (Curto Prazo)

1. **State reconciliation service** — Controller loop que periodicamente compara estado desejado (canvas) com real (cloud APIs) e dispara drift events.

2. **Resource catalog service** — Entidade `CatalogResource` unificada que indexa recursos gerenciados + descobertos, com schema normalizado multi-provider.

3. **Policy execution engine** — Bridge entre OPA policies e o pipeline de provisionamento (pré-plan, pré-apply).

### 13.3 Para o Frontend (Curto Prazo)

1. **Topology graph view** — ReactFlow-based map mostrando dependências entre recursos com health status (expansão do Service Map existente).

2. **Resource catalog explorer** — Sidebar/browser de recursos gerenciados e descobertos com busca e filtros multi-cloud.

3. **Snapshot diff viewer** — Visualização de alterações de configuração entre snapshots de recursos.

### 13.4 Cross-Cutting (Médio Prazo)

1. **OpenTelemetry como padrão de telemetria** — CloudBuilder deve instrumentar sua própria stack com OTel e expor pipeline OTel para usuários (substituir observabilidade nativa PostgreSQL).

2. **Automation API** — SDK Java/Go/TypeScript para que clientes embutam CloudBuilder em seus próprios sistemas (portais, CI/CD, bots).

3. **Abstração multi-provider** — Definir interface comum para todos os providers (CloudProvider) com métodos padronizados para CRUD, drift detection, e discovery.

---

## 14. Referências

### Agentes de Monitoramento
- Datadog Agent Architecture: https://docs.datadoghq.com/agent/architecture/
- Datadog Agent GitHub: https://github.com/DataDog/datadog-agent
- Datadog Autodiscovery: https://docs.datadoghq.com/getting_started/containers/autodiscovery/
- Datadog Resource Catalog: https://docs.datadoghq.com/infrastructure/resource_catalog/
- Datadog Kubernetes Agents: https://www.datadoghq.com/architecture/efficient-kubernetes-monitoring-with-the-datadog-cluster-agent/
- Grafana Agent Flow: https://grafana.com/docs/agent/latest/flow/
- Grafana Alloy (migration): https://grafana.com/docs/agent/latest/flow/
- Dynatrace OneAgent Modes: https://docs.dynatrace.com/docs/platform/oneagent/monitoring-modes/monitoring-modes
- Dynatrace Smartscape: https://www.dynatrace.com/platform/application-topology-discovery/smartscape/
- Dynatrace Kubernetes Operator: https://github.com/Dynatrace/dynatrace-operator
- New Relic Infrastructure Agent: https://docs.newrelic.com/docs/infrastructure/infrastructure-agent/
- New Relic Agent Control: https://docs.newrelic.com/docs/new-relic-control/agent-control/overview/
- New Relic NRDOT: https://newrelic.com/blog/news/first-class-opentelemetry-break-free-without-breaking-workflows

### Plataformas IaC
- HCP Terraform Architecture: https://developer.hashicorp.com/terraform/cloud-docs/architectural-details
- HCP Terraform Workspaces: https://developer.hashicorp.com/terraform/cloud-docs/workspaces
- Pulumi Cloud: https://www.pulumi.com/product/pulumi-cloud/
- Pulumi How It Works: https://www.pulumi.com/docs/iac/concepts/how-pulumi-works/
- Pulumi Patterns & Practices: https://www.pulumi.com/blog/pulumi-patterns-and-practices/
- Crossplane Documentation: https://docs.crossplane.io/latest/whats-crossplane/
- Crossplane Compositions: https://docs.crossplane.io/master/composition/compositions/
- Crossplane Providers: https://docs.crossplane.io/master/packages/providers/
- Upbound Marketplace: https://marketplace.upbound.io/providers
