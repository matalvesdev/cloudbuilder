# CloudBuilder — Perguntas Frequentes (FAQ)

## O que é Platform Engineering?

Platform Engineering é a prática de criar uma plataforma interna que permite que equipes de desenvolvimento provisionem e gerenciem infraestrutura de forma self-service, com guard rails de segurança e governança. O CloudBuilder é uma dessas plataformas.

## Como o CloudBuilder diferente do Terraform Cloud?

O CloudBuilder oferece um canvas visual drag-and-drop para projetar infraestrutura, enquanto o Terraform Cloud é baseado em código. Isso torna o CloudBuilder mais acessível para equipes que não são especialistas em Terraform, mantendo a geração automática de código IaC por baixo dos panos.

## O CloudBuilder suporta multi-cloud?

Sim. O CloudBuilder suporta AWS, Azure, Google Cloud Platform e Kubernetes. Você pode projetar infraestrutura multi-cloud em um único canvas visual.

## Como funciona o FinOps no CloudBuilder?

O CloudBuilder inclui um dashboard de FinOps integrado que mostra custos por provider, serviço e ambiente. Ele inclui anomaly detection, what-if analysis e budget alerts. Diferente de ferramentas dedicadas de FinOps, o custo é visível desde o design, não só após o deploy.

## O CloudBuilder é open-source?

O CloudBuilder é construído sobre stack open-source (React, Java, Go, PostgreSQL, Terraform) mas o produto em si é proprietário (SaaS). Estamos avaliando contribuições open-source para módulos específicos.

## Quanto custa o CloudBuilder?

O CloudBuilder oferece um plano gratuito com recursos limitados e planos pagos para equipes e empresas. Estamos em fase de beta — entre em contato para mais informações.

## O CloudBuilder suporta aprovações e governança?

Sim. O CloudBuilder inclui RBAC completo (admin, editor, viewer), aprovações de deploy, audit trail e feature flags. Tudo configurável por tenant.

## Como o drift detection funciona?

O CloudBuilder compara o estado desejado (definido no canvas) com o estado real da infraestrutura. Quando há divergências, ele gera alertas e sugere correções. Isso pode ser acionado por webhook (Git push) ou agendamento.

## O CloudBuilder suporta SSO?

Sim. O CloudBuilder suporta SSO via OAuth2 + PKCE com provedores como Google, GitHub e Okta. Também suporta MFA via TOTP.

## Posso usar o CloudBuilder com Kubernetes?

Sim. O CloudBuilder suporta Kubernetes como provider, permitindo projetar e provisionar recursos K8s (deployments, services, configmaps, namespaces) visualmente.
