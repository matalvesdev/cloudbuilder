# ADR-003: Hexagonal Architecture por Módulo

**Status**: Aceito

**Data**: 2026-06-15

## Contexto
Cada módulo CloudBuilder precisa evoluir independentemente, ser testável isoladamente, e permitir troca de implementações (ex: repositório JPA → MongoDB).

## Alternativas Consideradas

### A: Hexagonal Architecture (Ports & Adapters)
- **Prós**: Domínio puro sem dependências de framework, testável sem Spring Boot, ports/adapters claros, substituição de infra sem impacto no domínio
- **Contras**: Mais arquivos, indireção inicial, overhead para CRUD simples
- **Custo**: médio

### B: Camadas Tradicionais (Controller → Service → Repository)
- **Prós**: Simples, familiar, menos arquivos
- **Contras**: Service depende de framework (Spring Data), testar requer contexto Spring, difícil trocar implementação
- **Custo**: baixo

### C: Clean Architecture (casos de uso)
- **Prós**: Máximo isolamento, use cases explícitos
- **Contras**: Overhead massivo para CRUD, muitos arquivos para operações simples
- **Custo**: alto

## Decisão
**Alternativa A: Hexagonal Architecture**

Com adaptação: para módulos com CRUD predominante (design, iam), usar hexagonal completo. Para módulos skeleton (aiops, cost, observe), começar com camadas tradicionais e evoluir.

Estrutura por módulo:
```
domain/model/      → Entidades JPA + Value Objects (puro Java)
domain/port/       → Interfaces de repositório (independente de framework)
domain/service/    → Lógica de negócio (@Service, @Transactional)
domain/validator/  → Regras de validação do domínio
application/dto/   → Request/Response DTOs (records)
infrastructure/    → Controllers REST, implementações de port
```

## Consequências
- **Positivas**: Domínio testável sem Spring Boot, ports explícitos, substituição de implementação facilitada
- **Negativas**: Mais arquivos/camadas, overhead para operações CRUD simples
- **Riscos**: Time pode cair em over-engineering — mitigado permitindo camadas tradicionais em módulos skeleton

## Referências
- Alistair Cockburn, "Hexagonal Architecture" (2005)
- [Spring Modulith Application Architecture](https://docs.spring.io/spring-modulith/reference/application-architectures.html)
