# ADR-005: Position Model (objeto XYPosition vs flat x/y)

**Status**: Aceito

**Data**: 2026-06-15

## Contexto
Nós do ReactFlow usam `{ x: number, y: number }` (XYPosition). Backend JPA/Hibernate precisa armazenar estas posições no banco PostgreSQL. H2 em modo PostgreSQL é usado para testes. É necessário decidir o modelo de posição no backend.

## Alternativas Consideradas

### A: positionX / positionY como double separados (Atual)
- **Prós**: Simples, compatível com qualquer banco (H2 + PostgreSQL), sem tipos JSONB, queries diretas por coordenada
- **Contras**: Dois campos no lugar de um objeto, mapeamento extra no DTO converter para XYPosition
- **Custo**: baixo

### B: JSONB (PostgreSQL) com objeto `{"x": 1.0, "y": 2.0}`
- **Prós**: Modelo natural, campo único, queries JSONB
- **Contras**: Incompatível com H2 (não tem JSONB), limitação de banco, parsing extra
- **Custo**: médio

### C: Column `position` como TEXT (JSON string)
- **Prós**: Campo único, compatível H2 + PostgreSQL
- **Contras**: Sem validação estrutural no banco, parsing JSON em toda leitura, sem índices por coordenada
- **Custo**: baixo

### D: Type de banco (composite type PostgreSQL)
- **Prós**: Modelo natural, campo único tipado
- **Contras**: Incompatível com H2, complexidade extra, suporte JPA limitado
- **Custo**: alto

## Decisão
**Alternativa A: positionX / positionY como double separados** (manter atual)

Justificativas:
1. 100% compatível H2 + PostgreSQL sem configuração especial
2. Queries por coordenada são diretas (WHERE positionX > 100)
3. DTO mapping para XYPosition é trivial
4. Banco sem dependência de tipos avançados

## Consequências
- **Positivas**: Zero complexidade de banco, queries simples, compatibilidade total
- **Negativas**: Dois campos no lugar de um, mapeamento extra em DTOs
- **Riscos**: Nenhum — padrão testado e funcionando

## Referências
- [ReactFlow XYPosition type](https://reactflow.dev/api-reference/types/xy-position)
- [H2 Data Types](https://www.h2database.com/html/datatypes.html)
- [PostgreSQL Numeric Types](https://www.postgresql.org/docs/16/datatype-numeric.html)
