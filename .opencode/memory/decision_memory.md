# Decision Memory

## Histórico de Decisões

### 2026-06-15 — FAANg Framework Adoption
**Decisão**: Adotar FAANg (Future Autonomous AI Network for Engineering) como framework único de agentes de engenharia.
**Razão**: Unificar todos os agentes sob uma metodologia consistente com knowledge hierarchy, harness engineering pipeline, memória persistente e ADRs.
**Alternativas**: Manter agentes independentes sem framework unificado.
**Impacto**: Todos os agentes seguem o mesmo pipeline de pesquisa → planejamento → arquitetura → implementação → revisão → teste → segurança → performance → deploy → avaliação → memória.

### 2026-06-15 — Rate Limiting In-Memory
**Decisão**: RateLimitingFilter em ConcurrentHashMap com sliding window.
**Razão**: Zero dependências externas, suficiente para dev/demo.
**Alternativas**: Bucket4j, Redis-based rate limiting.
**Impacto**: Reinicia em cada deploy. Migrar para Redis quando em produção multi-instância.

### 2026-06-15 — Audit no Controller, não no Service
**Decisão**: AuditService injetado no AuthController (não no AuthService).
**Razão**: IP real do HttpServletRequest disponível no controller; domain service não deve depender de HTTP.
**Impacto**: Controllers fazem logging de auditoria, services mantêm-se puramente de negócio.

### 2026-06-15 — Register sem Auto-Auth
**Decisão**: RegisterPage usa authApi.register() + clearTokens() em vez de authStore.register().
**Razão**: Fluxo de verificação de email requer que usuário NÃO esteja autenticado após registro.
**Impacto**: UX: após registro, usuário vê tela "Verifique seu email" e precisa fazer login manual.

## Regras Imutáveis
- SEM Lombok (incompatível com JDK 25)
- SEM as any / @ts-ignore / @ts-expect-error
- UI sempre em PT-BR
- Ícones sempre lucide-react
- UUID para chaves primárias no backend
- @NullMarked em todos os pacotes Java
