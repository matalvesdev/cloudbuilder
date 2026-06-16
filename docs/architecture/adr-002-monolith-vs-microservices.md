# ADR-002: Monólito Modular vs Microsserviços

**Status**: Aceito

**Data**: 2026-06-15

## Contexto
CloudBuilder precisa de isolamento entre domínios (design, provision, iam, cost, observe) mas time pequeno. Microsserviços trazem complexidade operacional que pode atrasar o MVP.

## Alternativas Consideradas

### A: Spring Modulith (Monólito Modular)
- **Prós**: Isolamento lógico entre módulos, comunicação via eventos, deploy único, debug simples, transações cross-module, evolução gradual para microsserviços
- **Contras**: Acoplamento físico (mesmo processo), escalabilidade vertical limitada
- **Custo**: baixo

### B: Microsserviços (Spring Boot + Kafka + API Gateway)
- **Prós**: Escalabilidade independente, deploys isolados, times independentes, polyglot
- **Contras**: Complexidade operacional massiva (service discovery, API gateway, distributed tracing, saga), time pequeno não consegue manter
- **Custo**: alto

### C: Serverless (AWS Lambda + API Gateway + EventBridge)
- **Prós**: Zero operação, escalabilidade infinita, pay-per-use
- **Contras**: Cold starts, lock-in AWS, debugging complexo, estado externo obrigatório
- **Custo**: médio

## Decisão
**Alternativa A: Spring Modulith**

Justificativas:
1. Spring Modulith permite módulos com bounded contexts claros (design, iam, provision, audit)
2. Comunicação assíncrona via `@ApplicationModuleListener` e eventos Spring — mesma API que Kafka
3. Transações ácidas cross-module sem distributed transactions
4. Migração para microsserviços é gradual: extrair módulo → Kafka → deploy separado
5. Referência: Netflix "The Modular Monolith" e Sam Newman "Monolith to Microservices"

## Consequências
- **Positivas**: MVP acelerado, debug simples, deploy único, transações ACID
- **Negativas**: Escalabilidade limitada ao vertical, risco de acoplamento crescer se não monitorado
- **Riscos**: Se módulos acoplarem demais, extração para microsserviços será dolorosa — mitigado com Modulith verification tests (`@ApplicationModuleTest`)

## Referências
- [Spring Modulith Reference](https://docs.spring.io/spring-modulith/reference/)
- Sam Newman, "Monolith to Microservices" (O'Reilly, 2019)
- Netflix Blog: "Embracing the Differences: Monoliths are Not Dead"
- Martin Fowler: "Microservices" (martinfowler.com, 2014)
