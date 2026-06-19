# Auto-Documentation Feature — Design Especificação

## Visão Geral

Módulo nativo de documentação que escaneia, renderiza, importa e auto-gera documentação técnica do CloudBuilder — tudo dentro da plataforma, sem dependências externas.

## Funcionalidades

### 1. DocScanner — Descoberta de Documentação
- Varre o diretório `docs/` (e subdiretórios recursivamente)
- Detecta arquivos `.md` e extrai metadados (título do primeiro `#`, frontmatter)
- Constrói árvore de navegação (diretórios → arquivos)
- Cache de checksum SHA-256 para detectar mudanças

### 2. DocViewer — Leitura de Documentação
- Renderiza Markdown como HTML estilizado (brand colors)
- Suporte a: headers, listas, code blocks, tabelas, links, bold/italic, imagens
- TOC (Table of Contents) automático lateral
- Indicação de documentação desatualizada (stale badge)

### 3. DocImport — Importação
- Upload de arquivos `.md` via drag-drop ou file picker
- Scan de diretório customizado (path relativo configurável)
- Merge com documentação existente (detecta conflitos por checksum)

### 4. AutoGenerate — Geração Automática
- Ao salvar design: gera ADR rascunho com diagrama mermaid
- Ao provisionar: atualiza documentação de deployment
- Ao detectar mudança em canvas: sugere atualização de docs vinculadas
- Template de ADR: título, contexto, decisão, diagrama, consequências

## UI

```
┌──────────────────────────────────────────────────────────┐
│ DocsModule (Brand Navy header)                            │
│ ┌────────┬───────────────────────────────────────────────┐│
│ │ Sidebar│ DocViewer                                     ││
│ │ 240px  │                                               ││
│ │        │ # Título                                      ││
│ │ Search │                                               ││
│ │ ────── │ Contexto...                                   ││
│ │ 📁 docs│                                               ││
│ │  📄 README.md (active) │ ## Diagrama                    ││
│ │  📁 architecture │ ```mermaid                          ││
│ │   📄 adr-008   │ graph TB...                           ││
│ │   📄 adr-009   │ ```                                   ││
│ │  📁 roadmap    │                                       ││
│ │   📄 roadmap   │ ## Decisão                             ││
│ │ ────── │                                               ││
│ │ [Importar] │ [Stale] ⚠️ Design atualizado               ││
│ │ [Gerar ADR]│ [Atualizar Documentação]                  ││
│ └────────┴───────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## Templates de Geração

### Template ADR
```markdown
# ADR-{NUMBER}: {TITLE}

## Status
Rascunho — {DATE}

## Contexto
{auto-generated from canvas name + description}

## Decisão
{auto-generated from node types + connections}

## Diagrama
```mermaid
{auto-generated from canvas edges}
`` `

## Componentes
{auto-generated list of resources}

## Consequências
{pending review}
```
