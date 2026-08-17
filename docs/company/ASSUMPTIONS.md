# Assumption Register

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Customer Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| Platform engineers want visual infrastructure design | [INFERENCE] No direct evidence, but visual tools are popular in adjacent domains | Medium | Core product thesis fails | User interviews | UNVALIDATED |
| Users trust auto-generated Terraform | [INFERENCE] Terraform is standard, generation is mechanical | Medium | Provision adoption stalls | Test with real workloads | UNVALIDATED |
| Teams want unified platform vs. best-of-breed | [INFERENCE] Tool fatigue is common complaint | Medium | Users prefer separate tools | Interview 20 engineers | UNVALIDATED |
| Users will connect real cloud credentials | [INFERENCE] Security is a trust barrier | High | Provision loop can't complete | Test with read-only access | UNVALIDATED |

## Problem Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| Fragmented toolchain is a real pain | [INFERENCE] Multiple tools mentioned in competitor analysis | High | Problem isn't urgent enough | User interviews | UNVALIDATED |
| Visual → code translation is valuable | [FACT] Code generation works in the codebase | High | Core workflow isn't useful | User testing | UNVALIDATED |
| Cost visibility at design time matters | [INFERENCE] FinOps is growing trend | Medium | Cost feature isn't valued | A/B test cost estimation | UNVALIDATED |

## Solution Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| ReactFlow canvas is the right UI | [FACT] Canvas works with 300+ nodes | High | Need different UI paradigm | User feedback | PARTIALLY VALIDATED |
| Terraform is the right IaC target | [FACT] Terraform generation works | High | Need Pulumi/CDK support | User demand | VALIDATED |
| Go engine is production-ready | [FACT] Engine compiles and tests pass | Medium | Need different execution layer | Real cloud testing | UNVALIDATED |
| Docker Compose is sufficient for deployment | [FACT] 7 services run locally | Medium | Need Kubernetes for scale | Production testing | UNVALIDATED |

## Distribution Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| Open-source drives adoption | [INFERENCE] Open-source is standard for dev tools | Medium | No organic growth | Track GitHub metrics | UNVALIDATED |
| Content marketing reaches ICP | [INFERENCE] Platform engineers read technical content | Medium | Low acquisition | Measure content engagement | UNVALIDATED |
| Discord is the right community channel | [INFERENCE] Developers use Discord | Low | Wrong channel | Test Discord vs. alternatives | UNVALIDATED |

## Business Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| Users will pay for visual infrastructure | [INFERENCE] Similar tools charge $50-500/mo | Medium | No revenue | Pricing interviews | UNVALIDATED |
| Usage-based pricing aligns with value | [INFERENCE] Resources = value in infrastructure | Medium | Pricing mismatch | Test with users | UNVALIDATED |
| $49/mo starter price is right | [INFERENCE] Based on competitor pricing | Low | Wrong price point | Van Westendorp survey | UNVALIDATED |
| Open-core model works | [INFERENCE] GitLab, Grafana, etc. use it | Medium | Can't monetize open source | Track conversion | UNVALIDATED |

## Technical Assumptions

| Assumption | Evidence | Confidence | Impact if Wrong | Validation | Status |
|-----------|----------|------------|----------------|-----------|--------|
| Spring Modulith scales to our needs | [FACT] 30 modules compile and test | High | Need microservices sooner | Load testing | UNVALIDATED |
| PostgreSQL is sufficient for state | [FACT] Migrations work, queries are fast | High | Need different DB for scale | Production load | UNVALIDATED |
| Kafka is needed for event processing | [INFERENCE] Events are useful for decoupling | Low | Over-engineering | Remove if unused | UNVALIDATED |
