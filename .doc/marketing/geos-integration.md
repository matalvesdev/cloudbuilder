# GEOs no CloudBuilder — Integração de Marketing & Growth

## O que é GEOs?

**GEOs (Growth, Education & Organizational System)** é um framework open-source de agentes de IA para growth engineering. Ele orquestra agentes especializados que trabalham juntos para transformar sinais de mercado em ação coordenada: pesquisa, conteúdo, distribuição, leads, CRM, educação e analytics.

- **Repositório**: https://github.com/matalvesdev/geos
- **Licença**: Apache-2.0
- **Stack**: Python, SQLite, YAML workflows
- **Arquitetura**: Event-driven, agentes especializados, zero infra obrigatória

## Como o GEOs ajuda o CloudBuilder

### 1. 📊 Inteligência de Mercado
- Scan diário de concorrentes (Terraform Cloud, Pulumi, Spacelift)
- Monitoramento de tendências de Platform Engineering e FinOps
- Análise de gaps de conteúdo

### 2. 📝 Criação de Conteúdo
- Pipeline automatizado: Research → Brief → Draft → SEO Review → Approval → Publish
- Conteúdo otimizado para GEO (Generative Engine Optimization)
- 18 tipos de conteúdo suportados

### 3. 🔍 SEO & GEO
- Auditoria automática de SEO
- Otimização para motores de busca generativos (ChatGPT, Perplexity)
- Análise de keywords e gaps de conteúdo

### 4. 🎯 Geração de Leads
- Captura e qualificação de leads
- Scoring baseado em BANT
- Sequências de nurture por email

### 5. 📱 Social Media
- Agendamento de posts
- Draft para LinkedIn, Twitter, Bluesky
- Engajamento com comunidade

## Estrutura do GEOs no Projeto

```
geos/
├── geos.yaml                    # Configuração principal
├── workflows/
│   ├── cloudbuilder-content-pipeline.yaml    # Pipeline de conteúdo
│   ├── cloudbuilder-daily-intelligence.yaml  # Inteligência diária
│   ├── cloudbuilder-seo-audit.yaml           # Auditoria SEO/GEO
│   └── cloudbuilder-lead-generation.yaml     # Geração de leads
├── knowledge/
│   ├── cloudbuilder-overview.md              # Visão geral do produto
│   ├── cloudbuilder-faq.md                   # FAQ para GEO
│   ├── cloudbuilder-vs-competitors.md        # Páginas de comparação
│   └── geo-optimization-guide.md             # Guia de GEO
└── scripts/
    └── setup.sh                              # Setup do GEOs
```

## Workflows

### Content Pipeline
```bash
geos workflows run cloudbuilder-content-pipeline
```
Pipeline completo de conteúdo: pesquisa → brief → draft → SEO review → aprovação → publicação.

### Daily Intelligence
```bash
geos workflows run cloudbuilder-daily-intelligence
```
Scan diário de mercado, concorrentes e tendências.

### SEO Audit
```bash
geos workflows run cloudbuilder-seo-audit
```
Auditoria completa de SEO e GEO para todo o conteúdo.

### Lead Generation
```bash
geos workflows run cloudbuilder-lead-generation
```
Pipeline de geração e nurturing de leads.

## Setup

### Instalação
```bash
cd geos
pip install -e .
geos init --mode brownfield
geos db migrate
```

### Ingestão de Conhecimento
```bash
geos knowledge ingest docs --source docs
geos knowledge ingest .doc --source .doc
geos knowledge ingest geos/knowledge --source geos/knowledge
```

### Execução
```bash
# Listar workflows
geos workflows list

# Executar workflow
geos workflows run cloudbuilder-content-pipeline

# Verificar health
geos doctor
```

## Métricas de Sucesso

### GEO Metrics
- **Citações em AI**: Frequência com que CloudBuilder é citado em respostas de ChatGPT/Perplexity
- **Share of Voice**: Percentual de menções vs concorrentes
- **Answer Completion**: Qualidade das respostas sobre o produto

### Marketing Metrics
- **MRR Growth**: Crescimento de receita recorrente
- **Trial-to-Paid**: Conversão de trial para plano pago
- **Content Engagement**: Tempo de leitura, shares, comments
- **Lead Quality**: Score médio dos leads capturados

## Próximos Passos

1. **Instalar GEOs**: `pip install -e .` no diretório geos/
2. **Ingestar conhecimento**: Documentação do CloudBuilder
3. **Executar primeiro workflow**: Content Pipeline
4. **Monitorar métricas**: Dashboard de analytics
5. **Iterar**: Ajustar workflows baseado em resultados
