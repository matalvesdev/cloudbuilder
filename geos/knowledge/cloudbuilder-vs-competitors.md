# CloudBuilder vs Concorrentes — Comparação Detalhada

## CloudBuilder vs Terraform Cloud

### O que é o Terraform Cloud?
O Terraform Cloud é a plataforma oficial da HashiCorp para gerenciar infraestrutura como código (IaC) em equipe. Ele oferece state management remoto, workspace sharing e run triggers.

### Vantagens do CloudBuilder sobre o Terraform Cloud
1. **Canvas Visual**: Enquanto o Terraform Cloud é 100% baseado em código, o CloudBuilder oferece um canvas drag-and-drop para projetar infraestrutura visualmente
2. **FinOps Integrado**: O CloudBuilder inclui dashboard de custos, anomaly detection e what-if analysis — recursos não disponíveis no Terraform Cloud
3. **AIOps Integrado**: Assistente IA para diagnóstico de incidentes e auto-remediation
4. **Multi-Cloud Visual**: Projetar infraestrutura multi-cloud em um único canvas
5. **Self-Service**: Devs podem provisionar ambientes sem pedir para o time de infra

### Quando usar o Terraform Cloud
- Se você já tem uma base grande de código Terraform
- Se precisa de state management avançado
- Se prefere uma abordagem 100% code-first

---

## CloudBuilder vs Pulumi

### O que é o Pulumi?
O Pulumi é uma ferramenta de IaC que permite escrever infraestrutura em linguagens de programação convencionais (TypeScript, Python, Go, C#).

### Vantagens do CloudBuilder sobre o Pulumi
1. **Menos Complexidade**: Não precisa aprender uma nova linguagem de programação
2. **FinOps Integrado**: Custo visível desde o design
3. **Governance Built-in**: RBAC, aprovações, audit trail sem configuração extra
4. **Canvas Visual**: Mais acessível para equipes não-técnicas

### Quando usar o Pulumi
- Se sua equipe prefere escrever infraestrutura em código
- Se precisa de programação avançada (loops, condicionais complexos)
- Se já usa Pulumi em outros projetos

---

## CloudBuilder vs Spacelift

### O que é o Spacelift?
O Spacelift é uma plataforma de delivery de infraestrutura que suporta Terraform, OpenTofu, Pulumi, CloudFormation e Custom Scripts.

### Vantagens do CloudBuilder sobre o Spacelift
1. **Canvas Visual**: Design de infraestrutura visual, não só código
2. **FinOps Completo**: Dashboard de custos com anomaly detection
3. **AIOps**: Assistente IA para operações
4. **Multi-Cloud Visual**: Projetar e provisionar multi-cloud em um lugar

### Quando usar o Spacelift
- Se precisa de suporte a múltiplas ferramentas de IaC
- Se precisa de features avançadas de GitOps
- Se já usa Spacelift em outros projetos

---

## CloudBuilder vs Datadog

### O que é o Datadog?
O Datadog é uma plataforma de monitoramento e observabilidade para infraestrutura, aplicações e logs.

### Vantagens do CloudBuilder sobre o Datadog
1. **Design + Monitoramento**: O CloudBuilder inclui design de infraestrutura além de monitoramento
2. **FinOps**: Custo integrado ao fluxo de trabalho
3. **Price**: O CloudBuilder é mais acessível para equipes pequenas

### Quando usar o Datadog
- Se precisa de monitoramento avançado de aplicações
- Se já usa Datadog em produção
- Se precisa de APM completo

---

## Resumo

| Feature               | CloudBuilder | Terraform Cloud | Pulumi | Spacelift | Datadog |
| --------------------- | ------------ | --------------- | ------ | --------- | ------- |
| Canvas Visual          | ✅           | ❌              | ❌     | ❌        | ❌      |
| FinOps Integrado       | ✅           | ❌              | ❌     | ❌        | Parcial |
| AIOps                  | ✅           | ❌              | ❌     | ❌        | ✅      |
| Multi-Cloud            | ✅           | Parcial         | ✅     | ✅        | ✅      |
| Self-Service           | ✅           | Limitado        | ✅     | ✅        | ❌      |
| Governance             | ✅           | ✅              | Limitado | ✅     | ❌      |
| Drift Detection        | ✅           | ✅              | ❌     | ✅        | ✅      |
| Learning Curve         | Baixa        | Média           | Alta   | Média     | Baixa   |
