# CloudBuilder — User Journeys

## Journey 1: Design and Provision Infrastructure (Pedro — Platform Engineer)

```
1. DISCOVERY
   Pedro signs into CloudBuilder
   → Sees empty canvas with component palette
   → Browses AWS component library

2. DESIGN
   Drags VPC, subnets, EC2 instances, RDS, ALB onto canvas
   → Connects components (network routes, dependencies)
   → Configures properties (instance types, storage, security groups)
   → Canvas validates design in real-time

3. VALIDATE
   Runs validation engine
   → Checks: missing required fields, incompatible connections, security best practices
   → Fixes warnings shown inline on canvas

4. GENERATE
   Clicks "Generate Terraform"
   → System produces Terraform/OpenTofu code
   → Reviews generated code in split-pane view
   → Downloads or commits directly to GitHub

5. PROVISION
   Initiates deployment from canvas
   → System runs terraform plan (visual diff shown on canvas)
   → Approves and applies
   → Resources appear on canvas with live status

6. ITERATE
   Adds auto-scaling group
   → Re-generates and provisions
   → Drift detection shows differences between canvas and real infra
```

## Journey 2: Incident Response (Igor — SRE)

```
1. DETECT
   Alert fires for high latency on payment service
   → Igor opens CloudBuilder Observe
   → Sees dashboard with real-time metrics

2. INVESTIGATE
   Opens incident view
   → AI Root Cause Analysis highlights anomalous database CPU
   → Trace view shows slow queries
   → Logs correlated automatically

3. DIAGNOSE
   AI suggests: "RDS instance credit exhaustion — burst balance at 0%"
   → Recommends: upgrade to larger instance or add read replica
   → Shows cost impact of each recommendation

4. RESOLVE
   Opens CloudBuilder Design with affected architecture
   → Modifies RDS instance type on canvas
   → Generates and applies Terraform fix
   → Incident resolved, post-mortem auto-generated
```

## Journey 3: Cost Optimization (Marcos — FinOps Analyst)

```
1. EXPLORE
   Marcos opens CloudBuilder Cost
   → Sees cost explorer with breakdown by service, environment, team
   → Month-over-month trend shows 15% increase

2. ANALYZE
   Drills into EC2 costs
   → AI identifies 12 idle instances
   → Savings recommendation: $4,200/month

3. RECOMMEND
   Creates cost optimization ticket
   → Links to specific canvas components
   → Assigns to platform team with projected savings

4. TRACK
   Sets budget alerts for each environment
   → Configures cost anomaly detection
   → Forecasts next 3 months spending
```

## Journey 4: Self-Service Infrastructure (Carla — DevOps Engineer)

```
1. CATALOG
   Carla opens CloudBuilder Platform
   → Browses Service Catalog
   → Selects "Microservice with RDS" Golden Path

2. SCAFFOLD
   Fills form: service name, team, environment, instance size
   → System generates complete architecture on canvas
   → Includes: VPC, ECS/Fargate, RDS, ALB, monitoring

3. DEPLOY
   Reviews and customizes generated architecture
   → Adds environment variables
   → Clicks "Provision"
   → Environment is live in 15 minutes

4. GOVERN
   Compliance policies auto-enforced
   → Cost budgets attached
   → Security scanning integrated
   → Dashboard auto-provisioned
```
