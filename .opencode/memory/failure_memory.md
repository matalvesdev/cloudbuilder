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

## Sessão 2026-06-24 — Phase 5 Production Readiness Falhas
### Padrões de Falha Descobertos
1. **Go File Write Não Persistiu**: O `write` tool reportou sucesso em 6 arquivos Go que não existiam no disco após o retorno. Apenas após o prompt "Continue from the previous assistant state" os writes foram reexecutados e persistiram. Sempre verificar file system imediatamente após writes.
2. **Stores com persist + mock**: `driftStore` usava `persist` middleware + `simulateDriftDetection()` mesmo existindo API real no backend — dados falsos sendo mostrados como se fossem reais. Nunca usar persist para dados de API; mock é aceitável apenas em desenvolvimento.
3. **StateController já tinha drift endpoints**: Backend já expunha `GET /drift`, `POST /drift/resolve`, etc. em `StateController.java` desde Phase 6B-9 merge, mas PRR marcava como bloqueio B6 (não implementado). Pesquisa mais aprofundada antes de classificar blockers.
4. **AGENTS.md summary drift**: Ao atualizar AGENTS.md anchored summary, o número de templates Go foi contado incorretamente na primeira passagem (erro de arredondamento). Sempre verificar totais contra o file system real.
5. **No mvn/go/tsc in env**: Ambiente Windows não tem toolchains Java/Go/TypeScript disponíveis. Qualquer alteração não pode ser compilada/testada localmente — revisão de código é a única verificação possível.

### Bugs Abertos (monitorar)
- **H1**: SSO token signature verification via JWKS — segurança crítica
- **C9**: SSO refresh token endpoint — blocker para feature SSO
- **M2**: Hardcoded encryption key (`CloudBuilderDevKey32Bytes!!`) — secret exposure
- **/aiops/templates**: Frontend chama endpoint que não existe no backend AIOpsController — frontend trata gracefulmente com try/catch → [], mas feature de templates de design via AI não funciona

## Sessão 2026-06-27 — Frontend API Mismatch Fixes
### Padrões de Falha Descobertos
1. **Remoção de código "não usado" sem verificar importação de tipos**: Removi `getTemplates()` e `DesignTemplate` types após grep por `aiopsApi.` retornar vazio, mas os tipos eram importados indiretamente via `type { DesignTemplate }` em `AIOpsModule.tsx` e `aiops.utils.ts`. Sempre verificar imports de tipos (não apenas chamadas de método) antes de remover.
2. **BASE URL prefix no client.ts**: `BASE_URL = 'http://localhost:8080/api/v1'` em `client.ts` significa que paths nas APIs modulares NÃO devem incluir `/api/v1`. `multiRegion.ts` tinha `const BASE = '/api/v1/multiregion'` causando double prefix `api/v1/api/v1/`.
3. **DTO return types divergentes**: `syncEnvironment()` e `resolveDrift()` em `provision.ts` tinham return types incorretos que não correspondiam aos DTOs reais do backend. Sempre verificar backend DTOs ao definir frontend types.
4. **Funções não consumidas mas presentes**: Várias funções em `iam.ts`, `multiregion.ts`, `docs.ts` não são importadas por nenhum store ou módulo atualmente — são dead code preparado para uso futuro.
5. **Verificação de compilação após mudanças**: `npx tsc --noEmit` (exit code 0) confirmou que todas as correções são válidas. Sempre rodar após mudanças no frontend.

## Sessão 2026-06-30 — FAANg Code Quality Audit Falhas
### Padrões de Falha Descobertos
1. **`as any` cascata em bridges de tipos**: `collaborationManager.ts` tinah 6 `as any` para nodes/edges/status que JÁ eram tipados corretamente pelo yjsBridge (`Node<CanvasNodeData>[]`, `Edge[]`, `TeamMemberStatus`). Sempre verificar os tipos reais das interfaces antes de castar.
2. **Acesso a propriedade privada via `as any`**: `CursorsOverlay.tsx` acessava `(collaborationManager as any).yjsBridge?.['wsAccessor']` — hack frágil. Solução correta: getter público (`getWsAccessor()`).
3. **Union type mismatch silencioso**: `ProviderType` inclui `vercel/supabase/render` mas `CanvasExportDataV2.metadata.provider` só aceita `'aws' | 'azure' | 'gcp' | 'k8s' | 'multi'`. O `as any` original escondia isso — `as ProviderType` causou TS2322. Solução: inline union narrowing sem importar `ProviderType`.
4. **Double-cast necessário**: `api/cost.ts` — `CostRecordDTO` não tem index signature, então `as Record<string, unknown>` falha diretamente. Solução: `as unknown as Record<string, unknown>` (double-cast via unknown).
5. **PowerShell `-f` format operator vs bash**: No Windows com Git Bash, PowerShell `'{0}:{1}' -f $var` é interpretado como path de bash. Usar `.ps1` scripts em arquivos temporários é mais confiável que inline `-Command`.
6. **Falsos positivos de TODO/FIXME**: "Todos" (PT-BR para "all") gera ~30 falsos positivos na busca por `TODO`. Usar pattern mais específico como `// TODO:` ou `// FIXME:` em vez de substring solta.
