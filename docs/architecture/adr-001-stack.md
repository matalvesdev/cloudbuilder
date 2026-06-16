# ADR-001: Stack Tecnológica

**Status**: Aceito

**Data**: 2026-06-15

## Contexto
Definir a stack tecnológica do CloudBuilder — plataforma visual de design de infraestrutura multi-cloud com geração de IaC. Requer frontend interativo (canvas), backend de regras/validação/API, engine de provisionamento CLI, banco de dados relacional, cache, streaming e observabilidade.

## Alternativas Consideradas

### A: Stack Atual (React + Spring + Go + PostgreSQL)
- **Prós**: ReactFlow maduro para canvas, Spring Modulith ideal para monólito modular, Go performático para CLI, PostgreSQL maduro para dados relacionais + JSON
- **Contras**: Stack híbrida (3 linguagens), Go exige time extra, complexidade de build cross-language
- **Custo**: médio

### B: Full TypeScript (Next.js + NestJS + Node.js)
- **Prós**: Linguagem única, menos context switch, Next.js SSR, ecossistema unificado
- **Contras**: Node.js não ideal para CLI/Terraform execução, NestJS menos maduro que Spring para modulith, canvas SSR complexo
- **Custo**: médio

### C: Full Java (Spring Boot + JSP/Thymeleaf + CLI Spring Shell)
- **Prós**: Linguagem única, Spring Shell para CLI
- **Contras**: Canvas em JSP/Thymeleaf extremamente limitado, CLI Spring Shell pesada comparada a Go
- **Custo**: baixo (mas entrega prejudicada)

### D: Stack Pesada (Kubernetes + Microservices + gRPC)
- **Prós**: Escalabilidade, isolamento, polyglot
- **Contras**: Overhead massivo para MVP, time pequeno, complexidade operacional alta
- **Custo**: alto

## Decisão
**Alternativa A: Stack Atual (React + Spring + Go + PostgreSQL)**

Justificativas:
1. React + ReactFlow v12 é a melhor opção para canvas interativo (única alternativa viável)
2. Spring Boot 3.4.4 + Modulith permite monólito modular — evolui para microsserviços sem reescrita
3. Go é ideal para CLI de provisionamento (binário único, performance, execução de processos externos)
4. PostgreSQL como fonte da verdade única — reduz complexidade operacional inicial
5. Kafka/Redis adicionados apenas quando necessários (streaming e cache)

## Consequências
- **Positivas**: Stack testada, documentação abundante, time pode se especializar por camada
- **Negativas**: 3 linguagens exigem proficiência do time em múltiplos ecossistemas
- **Riscos**: Go pode ser gargalo se time não tem expertise — mitigado com escopo limitado do engine (apenas CLI + gRPC)

## Referências
- [Spring Modulith Reference](https://docs.spring.io/spring-modulith/reference/)
- [ReactFlow v12 Docs](https://reactflow.dev/api-reference)
- [Go Cobra CLI](https://github.com/spf13/cobra)
- Netflix Tech Blog: "The Modular Monolith" (2024)
