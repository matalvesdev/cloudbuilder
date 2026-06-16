# CloudBuilder — Ubiquitous Language

## Core Terms

| Term | Definition |
|------|------------|
| **Canvas** | The visual workspace where infrastructure is designed. The single source of truth. |
| **Component** | A reusable building block representing an infrastructure resource (e.g., VPC, EC2, RDS). |
| **Connection** | A link between components representing network, dependency, or data flow relationships. |
| **Design** | A complete infrastructure architecture composed of components and connections on a canvas. |
| **Blueprint** | A reusable, versioned design template that can be instantiated into environments. |
| **Environment** | An isolated instance of a design deployed to a specific target (dev, staging, prod). |
| **Provider** | An adapter that maps cloud resources (AWS, Azure, GCP, K8s) to canvas components. |
| **Resource** | A provisioned cloud resource managed by CloudBuilder. |
| **Stack** | A collection of resources managed as a unit, mapping to a Terraform/OpenTofu state. |
| **State** | The current known condition of provisioned infrastructure, synchronized with the canvas. |
| **Drift** | The difference between the canvas design and the actual state of provisioned resources. |
| **Validation** | The process of checking a design for correctness, completeness, and policy compliance. |
| **Generation** | The process of producing Terraform/OpenTofu code from a canvas design. |
| **Provisioning** | The process of deploying infrastructure from generated code to a cloud provider. |
| **Observation** | The collection and analysis of metrics, logs, and traces from provisioned resources. |
| **Telemetry** | Data emitted by infrastructure including metrics, logs, and traces via OpenTelemetry. |
| **Cost Model** | The pricing structure of a component or design, based on cloud provider pricing. |
| **Forecast** | A predictive estimate of future costs based on current usage and trends. |
| **Recommendation** | An AI-generated suggestion for optimization (cost, performance, security, reliability). |
| **Catalog** | A curated collection of approved components and blueprints for self-service. |
| **Golden Path** | A standardized, approved architecture pattern for common use cases. |
| **Incident** | An event that indicates a problem with infrastructure requiring investigation. |
| **Root Cause Analysis** | AI-driven identification of the underlying cause of an incident. |
| **Tenant** | A logically isolated customer instance with its own users, designs, and resources. |
| **Policy** | A rule that governs infrastructure design, cost, security, or compliance. |
| **Audit Trail** | An immutable log of all actions performed in the platform. |
