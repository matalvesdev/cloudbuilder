# Risk Register

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Product Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| Core loop doesn't work end-to-end | Medium | Critical | High | Test with real GCP credentials immediately | Engineering |
| Users don't want visual infrastructure design | Medium | Critical | High | Get 10 design partners, watch them use it | Product |
| Auto-generated Terraform isn't production-ready | Medium | High | Medium | User testing with real workloads | Engineering |
| Canvas UX is too complex | Medium | High | High | User testing, simplify onboarding | Design |
| Onboarding is too slow | High | High | High | Measure time to first provision, optimize | Product |

## Market Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| "Visual infrastructure" isn't a real category | Low | Critical | Medium | Validate with 20 user interviews | Product |
| TAM too small for venture-scale business | Medium | High | Low | Bottom-up market sizing | Business |
| Enterprise won't adopt open-source tools | Medium | Medium | Low | Start with SMB, prove value first | GTM |
| Brazilian market too small | Low | Medium | Low | Expand to LatAm, then global | GTM |

## Technical Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| Go engine fails in production | Medium | High | Medium | Extensive testing, rollback capability | Engineering |
| PostgreSQL doesn't scale | Low | High | Low | Load testing, caching strategy | Engineering |
| Docker Compose insufficient for production | High | Medium | High | Plan Kubernetes migration path | DevOps |
| Terraform/OpenTofu fragmentation | Medium | Medium | Low | Support both, abstract execution layer | Engineering |
| Security breach (credential theft) | Low | Critical | Medium | Encryption, audit, least privilege | Security |

## Business Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| No paying customers | High | Critical | High | Get 10 design partners, validate willingness to pay | Business |
| Can't hire fast enough | Medium | High | Medium | Open source, community contributions | Founders |
| Competitor raises massive funding | Medium | Medium | Low | Focus on product, not fundraising | Business |
| Cash runs out before PMF | Medium | Critical | High | Keep burn low, focus on revenue | Business |

## Operational Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| Production outage | Medium | High | High | Health checks, monitoring, rollback | DevOps |
| Data loss | Low | Critical | Medium | Backups, disaster recovery plan | Engineering |
| Key person dependency | High | High | Medium | Documentation, knowledge sharing | Founders |
| Dependency vulnerability | Medium | Medium | High | Dependency scanning, regular updates | Engineering |

## AI Risks

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|------------|--------|---------------|-----------|-------|
| AI recommends destructive actions | Medium | Critical | Medium | Policy engine, human approval required | AI |
| AI hallucination causes infrastructure damage | Medium | High | Medium | Deterministic validation, human review | AI |
| AI cost exceeds value | Medium | Medium | High | Track cost per successful task | AI |
| AI commoditization reduces differentiation | Medium | Medium | Low | AI is capability layer, not core product | Product |

## Risk Review Cadence

- **Weekly:** Check P0/P1 risks, update status
- **Monthly:** Full risk register review
- **Quarterly:** Strategic risk assessment
