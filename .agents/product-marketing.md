# CloudBuilder — Product Marketing Context

> Gerado em: 2026-06-25
> Versão: 1.0

---

## O que é CloudBuilder?

**CloudBuilder** é uma plataforma de platform engineering que conecta **design visual de infraestrutura** → **geração de IaC** → **provisionamento** → **observabilidade** → **custo** → **AIOps** em um pipeline único e integrado.

É o "Miro que deploya. O Datadog que projeta."

### Elevator Pitch

> "Pare de desenhar infra que nunca é deployada. CloudBuilder desenha **e** deploya."

### Frases de Posicionamento

- **vs Miro/Excalidraw**: "Pare de desenhar infra que nunca é deployada. CloudBuilder desenha **e** deploya."
- **vs Datadog/New Relic**: "Pague pelo que você projeta, não pelo que seus logs gritam."
- **vs Dynatrace**: "Dynatrace é AI para 200 hosts enterprise. CloudBuilder é AI para o workflow do arquiteto de nuvem."
- **vs Grafana**: "Grafana observa o que já existe. CloudBuilder projeta o que vai existir **e** observa."
- **Geral**: "O Internal Developer Platform que começa no design e termina na produção — sem sampling, sem surpresas, sem lock-in."

---

## ICP (Cliente Ideal)

### Primary ICP: Cloud Architect / Platform Engineer

| Atributo | Descrição |
|----------|-----------|
| **Cargo** | Cloud Architect, Platform Engineer, Staff DevOps, SRE Lead, Infra Director |
| **Empresa** | 100-5,000 funcionários, time de infraestrutura de 5-50 pessoas |
| **Stack** | Multi-cloud (AWS + Azure/GCP), Kubernetes, Terraform |
| **Dor #1** | Desenha infra no Miro/Excalidraw → depois reimplementa em Terraform manualmente — duplicação de trabalho |
| **Dor #2** | Tool sprawl: 2-3 ferramentas de observabilidade, custo imprevisível, sem unified dashboard |
| **Dor #3** | Dificuldade de comunicar design de infra para stakeholders não-técnicos |
| **Ambiente** | Linux/Mac, terminal-friendly, git-native |

### Secondary ICP: DevOps Engineer

| Atributo | Descrição |
|----------|-----------|
| **Cargo** | DevOps Engineer, SRE, SysAdmin |
| **Dor** | Cansado de alert fatigue, bill shock, e complexity overhead das ferramentas tradicionais |
| **Motivação** | Quer uma plataforma que faça mais com menos ferramentas |

---

## Pricing

**Modelo**: Simples por design — sem surpresas, sem sampling, sem 99th percentile billing.

| Tier | Preço | Inclui |
|------|-------|--------|
| **Free** | $0 | Até 3 designs, 1 ambiente, observabilidade básica, comunidade |
| **Pro** | $X/architect/mês | Designs ilimitados, ambientes multi-cloud, observabilidade completa, AI Chat, colaboração |
| **Enterprise** | $Y/architect/mês (custom) | SSO/SAML, RBAC avançado, self-hosted, SLA, suporte prioritário, compliance reports |

**Diferenciais de pricing:**
- Sem taxa por volume de dados (logs, métricas, traces)
- Sem taxa por cardinalidade de tags
- Sem sampling — você vê 100% dos seus dados
- Self-hosted disponível para Enterprise (sem vendor lock-in)
- Pricing transparente desde o momento da compra

---

## Forças e Fraquezas

### Forças (Strengths)

1. **Pipeline único design→deploy→observe**: Nenhum concorrente conecta visual design com IaC generation + provisionamento + observabilidade em um produto só
2. **Canvas topology-aware**: Como o design é a fonte da verdade, observabilidade é nativamente topology-aware — Service Map não é plugin, é a estrutura fundamental
3. **Zero lock-in**: Gera Terraform/OpenTofu standard. Use CloudBuilder para projetar, deploy com qualquer stack. Código gerado é portável
4. **FinOps preventivo**: What-if Cost mostra custo estimado antes de deployar — otimização no design, não na conta
5. **Self-hosted**: Pode rodar 100% on-prem (docker-compose com 3 serviços). Sem agente proprietário. OpenTelemetry nativo
6. **Pricing transparente**: Sem bill shock, sem hidden costs, sem 99th percentile billing

### Fraquezas (Weaknesses)

1. **Maturidade**: Produto mais novo que concorrentes — menos integrações, menos templates, comunidade menor
2. **Market fit**: Platform engineering é categoria emergente — precisa educar o mercado
3. **Observabilidade**: Nativa mas menos madura que Datadog/Grafana/Dynatrace (falta sampling avançado, columnar storage, RUM)
4. **Colaboração**: Canvas colaborativo existe mas sem real-time multiplayer (diferente de Miro/tldraw)
5. **Ecossistema de integrações**: 100+ integrações vs 1000+ de Datadog
6. **Mobile/offline**: Não tem app mobile nem modo offline

---

## Tom de Voz

| Atributo | Diretriz |
|----------|----------|
| **Linguagem** | PT-BR para UI, technical English para código/docs |
| **Tom** | Confiante, técnico, direto — sem hype, sem buzzwords vazias |
| **Estilo** | "Staff Engineer explaining architecture to peer" — não "marketeiro vendendo sonho" |
| **Personalidade** | Honesto, transparente, engineering-first |
| **O que evitar** | AI slop, emojis em excesso, claims exagerados, "game-changing", "revolutionary" |
| **O que usar** | Dados concretos, comparações honestas, benchmarks reais, architecture decision records |

### Exemplos de Voz

**Bom**: "CloudBuilder gera Terraform/OpenTofu standard. Você pode levar o código para qualquer lugar. Sem lock-in."
**Ruim**: "CloudBuilder is a revolutionary game-changing platform that will transform your cloud journey forever! 🚀"

**Bom**: "What-if Cost mostra o custo estimado do seu design antes de deployar. Otimize no design, não na conta."
**Ruim**: "Our cutting-edge AI-powered FinOps solution optimizes your cloud spend intelligently!"

---

## Concorrentes Diretos

| Concorrente | Categoria | Onde ganham | Onde perdem |
|-------------|-----------|-------------|-------------|
| **Datadog** | Observability | Maturidade, 1000+ integrações | Bill shock, pricing opaco, sem design→deploy |
| **Grafana** | Observability OSS | LGTM stack, comunidade, self-hosted | Complexity, deprecation velocity, docs ruins |
| **Dynatrace** | APM Enterprise | Davis AI, PurePath, Smartscape | Pricing "spreadsheet from hell", vendor lock-in |
| **New Relic** | APM | NRQL, entity-centric, scorecards | PE takeover, pricing migração forçada |
| **Miro** | Visual collaboration | Colaboração, templates, 100M+ usuários | Performance em escala, pricing viewer, sem IaC |
| **Excalidraw** | Diagramming | Simplicidade, open source, PWA | Sem colaboração robusta, sem IaC, sem observabilidade |
| **Terraform Cloud** | IaC | State management, policy-as-code, VCS integration | Sem design visual, sem observabilidade |
| **Pulumi Cloud** | IaC | General-purpose languages, Automation API | Sem design visual, curva de aprendizado |

## Blue Ocean

**Ninguém** conecta visual design + IaC generation + provision + cost estimation + observabilidade + drift detection em pipeline único. Esta é a vantagem competitiva sustentável do CloudBuilder.

---

## Metas de Conteúdo para 2026

| Meta | Descrição |
|------|-----------|
| **#1** | Estabelecer CloudBuilder como autoridade em platform engineering |
| **#2** | Educar o mercado sobre "design-to-deploy pipeline" como categoria |
| **#3** | Gerar leads qualificados (Cloud Architects, Platform Engineers) |
| **#4** | Construir comunidade de early adopters |
| **#5** | Diferenciar-se dos concorrentes de observabilidade e diagramming |
