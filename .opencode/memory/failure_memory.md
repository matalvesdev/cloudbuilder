# Failure Memory

## Falhas Registradas

### TBD — Registre falhas aqui quando ocorrerem

## Padrões de Falha a Evitar
1. **Mock Data Esquecido**: Dashboard usava $mockService em fallback — nunca misturar dados reais com mock em produção
2. **Alert no Frontend**: LoginPage tinha `alert("Enviaremos um link...")` — substituir por toast/notificação de UI
3. **TypeScript any**: Evitar type assertions que escondem erros reais
4. **Lombok no Backend**: JDK 25 não suporta Lombok — usar getters/setters explícitos
5. **Double ID Types**: Manter consistência frontend (nanoid string) vs backend (UUID) documentada

## Lições Aprendidas
- Sempre verificar `tsc --noEmit` após mudanças no frontend (catch errors cedo)
- `useAuthApi` vs `authApi` direto: stores com api client embutido vs apis modulares
- H2 console em prod é risco de segurança — proteger por profile + flag
- Rate limiting em memória é suficiente para dev mas escala mal — planejar migração Redis

## Sessão 2026-06-22 — ADR Audit Falhas
### Padrões de Falha Descobertos
1. **Falso Positivo de Auditoria**: Assumir "sem SSO UI" sem verificar o código real resultou em alegação incorreta. Sempre verificar diretamente.
2. **Hardcoded Roles**: `Set.of("VIEWER")` em JWT generation e AuthResult — esquecer de resolver do DB a role real. Sempre resolver permissões de fonte autoritativa.
3. **Custom Parser vs Jackson**: `parseJsonSimple()` não lidava com JSON aninhado, arrays, escaped quotes — Jackson já estava no classpath. Nunca reimplementar parser JSON quando Jackson disponível.
4. **deleteBy Sem Tenant Filter**: `deleteByRollupDateBefore()` afetava todos os tenants — esquecer tenant isolation em cleanup. Sempre incluir tenantId em operações de deleção em massa.
5. **User Rollup Sem Upsert**: `save(new AnalyticsUserRollupDaily(...))` sem verificar existência prévia causava constraint violation em re-run. Seguir mesmo padrão de upsert usado nos outros rollups.

### Bugs Abertos (monitorar)
- **H1**: SSO token signature verification via JWKS — segurança crítica
- **C9**: SSO refresh token endpoint — blocker para feature SSO
- **M2**: Hardcoded encryption key (`CloudBuilderDevKey32Bytes!!`) — secret exposure
