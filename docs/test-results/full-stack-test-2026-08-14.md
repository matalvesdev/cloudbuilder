# CloudBuilder — Full Stack Test Results
**Date:** 2026-08-14
**Tester:** Buffy (AI Agent)
**Environment:** Docker Compose (local)

---

## 📊 Resumo Executivo

| Componente | Status | Notas |
|---|---|---|
| Docker Compose | ✅ 7/7 serviços saudáveis | Todos os healthchecks passando |
| Backend API | 🟡 Funcional com gaps | Login, Canvas CRUD, Code Gen funcionam |
| Frontend | ✅ Build OK | 307 testes passando |
| Go Engine | ✅ Build OK | Todos os testes passando |
| Observability | ❌ Erros 500 | Tabelas não criadas corretamente |
| AIOps | ❌ Erros 500 | Dependência de observability |
| Cost Management | ❌ Endpoint não encontrado | URL incorreta ou endpoint não implementado |
| Platform Catalog | ✅ Funcional | Retorna array vazio (sem dados seed) |

---

## 🔧 Fluxo Testado: Login → Canvas → Terraform

### 1. Autenticação ✅
```
POST /api/v1/auth/login
→ 200 OK com JWT token, refreshToken, roles, tenantId
```

### 2. Canvas CRUD ✅
```
POST /api/v1/canvases → 201 Created (canvas ID gerado)
GET /api/v1/canvases → 200 OK (lista paginada)
GET /api/v1/canvases/{id} → 200 OK (canvas com nodes e edges)
POST /api/v1/canvases/{id}/nodes → 201 Created (node adicionado)
POST /api/v1/canvases/{id}/edges → 201 Created (edge adicionado)
PUT /api/v1/canvases/{id} → 200 OK (atualizado)
DELETE /api/v1/canvases/{id} → 204 No Content
```

### 3. Component Definitions ✅
```
POST /api/v1/component-definitions → 201 Created
GET /api/v1/component-definitions?provider=gcp → 200 OK
DELETE /api/v1/component-definitions/{id} → 204 No Content
```

### 4. Code Generation 🟡 Parcial
```
POST /api/v1/canvases/{id}/generate?engine=terraform → 200 OK
```

**Issues encontrados:**
- ❌ `google_compute_subnetwork` não é gerado (apenas 2 de 4 recursos)
- ❌ `google_sql_database_instance` não é gerado
- ❌ Resource IDs vazios no template (`google_compute_network ""`)
- ❌ Variáveis template não preenchidas (`auto_create_subnetworks`, `machine_type`)
- ❌ `provider "gcp"` não tem configuração (falta `project` e `region`)

### 5. Observability ❌
```
GET /api/v1/observe/metrics/query → 500 Internal Server Error
GET /api/v1/observe/logs/search → 500 Internal Server Error
GET /api/v1/observe/alert-rules → 500 Internal Server Error
```

**Causa raiz:** Tabelas do banco não criadas corretamente (Flyway desabilitado, schema incompleto)

### 6. AIOps ❌
```
POST /api/v1/aiops/query → 500 Internal Server Error
```

**Causa raiz:** Dependência do módulo Observability (LLM client fallback para rule-based)

### 7. Cost Management ❌
```
GET /api/v1/cost/environments/default/costs → 404 Not Found
```

**Causa raiz:** Endpoint não existe ou URL incorreta

### 8. Platform Catalog ✅
```
GET /api/v1/platform/catalog → 200 OK (array vazio)
```

---

## 🐛 Bugs Encontrados

### Críticos (Bloqueiam fluxo completo)

1. **Flyway migrations com ordem incorreta** — V10 antes de V2 (ordem alfabeta vs numérica)
   - Impacto: Tabelas do banco não criadas na ordem correta
   - Solução: Renomear migrations com zero-padding (V01, V02, etc.)

2. **Code Generation não gera todos os recursos** — Apenas 2 de 4 recursos GCP
   - Impacto: Terraform incompleto, provisionamento impossível
   - Solução: Verificar lógica de `resolveTemplate()` no `CodeGeneratorService`

3. **Resource IDs vazios no template** — `google_compute_network ""` em vez de `google_compute_network.node-vpc`
   - Impacto: Terraform inválido
   - Solução: Verificar `renderTemplate()` e passagem de `node.id()`

### Médios

4. **Observability endpoints retornam 500** — Tabelas não existem
   - Impacto: Métricas, logs, alertas indisponíveis
   - Solução: Criar migrations corretas ou seed data

5. **Cost Management endpoint não encontrado** — URL pode estar errada
   - Impacto: Gestão de custos indisponível
   - Solução: Verificar rotas no `CostController`

6. **OPA healthcheck falhava** — Imagem `latest` sem shell
   - Impacto: OPA não reportava saúde
   - Solução: Usar `latest-debug` ou healthcheck alternativo

### Baixos

7. **Nginx healthcheck com wget** — IPv6 vs IPv4
   - Impacto: Nginx reportava unhealthy
   - Solução: Usar `curl` no healthcheck

8. **Provision Engine não aceita `--config`** — Flag não existe
   - Impacto: Container não inicia
   - Solução: Usar env vars ou flag correta

---

## ✅ O que funciona perfeitamente

1. **Docker Compose** — Todos os 7 serviços sobem e passam healthchecks
2. **Autenticação JWT** — Login, refresh, /me funcionam
3. **Canvas CRUD** — Create, Read, Update, Delete de canvases, nodes e edges
4. **Component Definitions** — CRUD completo
5. **Frontend Build** — TypeScript compila, 307 testes passam
6. **Go Engine** — Compila, todos os testes passam
7. **Backend Tests** — 720/720 passando

---

## 📋 Próximos Passos Recomendados

1. **Corrigir Flyway migrations** — Renomear com zero-padding para ordem correta
2. **Corrigir Code Generator** — Adicionar templates para `google_compute_subnetwork` e `google_sql_database_instance`
3. **Corrigir renderTemplate** — Passar node.id corretamente para templates
4. **Reativar Flyway** — Depois de corrigir ordem das migrations
5. **Seed data** — Criar component definitions padrão (AWS, GCP, Azure)
6. **Testar Go Engine** — Verificar gRPC e provisionamento real
7. **Integrar Frontend** — Testar fluxo completo via browser
