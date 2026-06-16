# Progress Memory

## Sessão Atual
**Data**: 2026-06-15
**Contexto**: Refatoração dos agents para framework FAANg

## O Que Foi Feito
1. SecurityConfig: H2 console + CORS por profile (dev vs prod)
2. client.ts: 401 redirect via authStore.setLogoutFn() (SPA-safe)
3. Fluxo Forgot/Reset Password (backend + frontend completos)
4. DashboardModule: mock data removido, dados reais da API
5. SettingsModule: abas públicas (profile/system) vs admin-only
6. RegisterPage: tela de verificação de email pós-registro
7. Backend: Rate Limiting filter + Audit logging no AuthController
8. Verificação: TypeScript 0 erros, build Vite OK (2829 modules, 8.41s)
9. FAANg Agent Expansion: database-specialist, observability-engineer, security-engineer
10. FAANg Full Framework: 16 agents refatorados, memória persistente, ADRs

## Sessões Anteriores
- RBAC backend (IAM Modulith) — ✅ Completo
- RBAC frontend (authStore, ProtectedContent, ProtectedAction) — ✅ Completo
- Permission gating (módulos + botões por role) — ✅ Completo
- Multi-tenant (TenantSelector + TenantFilter) — ✅ Completo
- Rate limiting + audit — ✅ Completo
- Forgot/Reset password — ✅ Completo
