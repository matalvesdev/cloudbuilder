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
