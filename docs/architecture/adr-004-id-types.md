# ADR-004: ID Types (nanoid Frontend vs UUID Backend)

**Status**: Aceito

**Data**: 2026-06-15

## Contexto
Frontend (ReactFlow) e backend (Spring Boot/JPA) precisam de IDs para nós, arestas e canvas. ReactFlow gera IDs automaticamente como strings. Backend JPA tradicionalmente usa UUID ou auto-increment. É necessário decidir o formato de ID para garantir compatibilidade sem conversões constantes.

## Alternativas Consideradas

### A: nanoid on Frontend + UUID on Backend (Atual)
- **Prós**: ReactFlow usa nanoid nativamente (strings), backend usa UUID tipo 4 (universal), sem risco de colisão
- **Contras**: Conversão string↔UUID em toda comunicação API, incompatibilidade de tipos, dupla gestão de IDs
- **Custo**: médio

### B: UUID em Ambos
- **Prós**: Tipo único, sem conversão, UUID é padrão JPA, universalmente único
- **Contras**: ReactFlow não suporta UUID nativamente — exige geradores custom, UUIDs longos (36 chars) em URL, performance de índice ligeiramente pior que auto-increment
- **Custo**: baixo

### C: nanoid em Ambos
- **Prós**: String curta (21 chars), legível, ReactFlow nativo, URLs limpas
- **Contras**: JPA não tem gerador nanoid nativo — exige implementação custom, colisão teórica (baixa probabilidade)
- **Custo**: médio

### D: Auto-Increment em Ambos (inteiro)
- **Prós**: Performance máxima, URLs curtas, índice eficiente
- **Contras**: Sem segurança (enumeração de recursos), problema em merge/distributed, ReactFlow exige string
- **Custo**: baixo

## Decisão
**Alternativa A: nanoid Frontend + UUID Backend** (manter atual)

Justificativas:
1. ReactFlow gera IDs como string nativamente — nanoid é padrão
2. Backend UUID é padrão JPA e universalmente único
3. Conversão é feita no controller/DTO layer — custo aceitável
4. Risco de colisão próximo de zero em ambos os lados
5. URLs de API usam UUID (38e7d8a1-4f2c-4b3e-9a6d-7c8b9a0d1e2f) — hashable, seguro

## Consequências
- **Positivas**: Melhor do mundo para cada lado, sem comprometer segurança ou funcionalidade
- **Negativas**: Conversão string↔UUID em controllers, necessidade de mapper (MapStruct)
- **Riscos**: Erro de conversão pode causar resource not found — mitigado com testes de controller

## Referências
- [nanoid](https://github.com/ai/nanoid) — string IDs para JavaScript
- [UUID RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122)
- [ReactFlow Node Types](https://reactflow.dev/api-reference/types/node)
