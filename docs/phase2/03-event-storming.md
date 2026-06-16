# CloudBuilder — Event Storming

## Big Picture Event Storming

### Domain Events Timeline (Design → Provision → Observe → Optimize)

```
PHASE: DESIGN
─────────────────────────────────────────────────────────────
UserLoggedIn → TenantLoaded → CanvasInitialized → ComponentSelected 
→ ComponentDraggedToCanvas → ComponentDropped → ComponentAddedToCanvas
→ PropertyEdited → ComponentConnected → ConnectionValidated
→ DesignValidated → DesignValidationFailed → DesignValidationPassed
→ DesignSaved → DesignVersionCreated

PHASE: CODE GENERATION
─────────────────────────────────────────────────────────────
GenerateCodeRequested → DesignLoaded → TerraformCodeGenerationStarted
→ ProviderMapped → ResourceTemplatesRendered → CodeGenerated
→ CodeValidated → CodeValidationPassed → CodeArtifactStored

PHASE: PROVISION
─────────────────────────────────────────────────────────────
DeploymentInitiated → TerraformInitStarted → TerraformInitCompleted
→ TerraformPlanCreated → PlanReviewed → PlanApproved → PlanRejected
→ TerraformApplyStarted → ResourceCreationStarted → ResourceCreationProgress
→ ResourceCreated → ResourceCreationFailed → DeploymentCompleted
→ DeploymentFailed → StateStored → ResourcesLinkedToCanvas

PHASE: OPERATIONS
─────────────────────────────────────────────────────────────
HealthCheckExecuted → DriftDetectionTriggered → DriftDetected
→ DriftRemediationStarted → DriftRemediated → ResourceDeleted
→ ResourceModified → StateUpdated

PHASE: OBSERVABILITY
─────────────────────────────────────────────────────────────
TelemetryReceived → MetricProcessed → LogIngested → TraceSampled
→ SpanProcessed → MetricThresholdBreached → AlertFired
→ IncidentCreated → IncidentAcknowledged → InvestigationStarted
→ RootCauseIdentified → IncidentResolved → PostMortemGenerated

PHASE: COST
─────────────────────────────────────────────────────────────
BillingDataImported → CostAllocated → CostReportGenerated
→ CostAnomalyDetected → OptimizationRecommendationCreated
→ BudgetAlertTriggered → ForecastUpdated

PHASE: PLATFORM
─────────────────────────────────────────────────────────────
CatalogItemCreated → CatalogItemPublished → GoldenPathPublished
→ TemplateInstantiated → ScaffoldingGenerated → PolicyEvaluated
→ PolicyViolated → ScorecardUpdated → ComplianceStatusChanged

PHASE: AI
─────────────────────────────────────────────────────────────
AIQuerySubmitted → NaturalLanguageProcessed → IntentRecognized
→ ContextRetrieved → AIResponseGenerated → IncidentClassified
→ SeverityAssessed → AutomatedRemediationExecuted → LearningFeedbackRecorded
```

## Event Commands (triggered by users)

| Command | Triggered By | Description |
|---------|-------------|-------------|
| `AddComponentToCanvas(componentType, position)` | User | Drag and drop component |
| `ConnectComponents(sourceId, targetId, connectionType)` | User | Create connection |
| `EditProperty(componentId, property, value)` | User | Modify component property |
| `ValidateDesign(designId)` | User | Run validation |
| `GenerateCode(designId, provider)` | User | Generate Terraform |
| `Deploy(environmentId)` | User | Start deployment |
| `ApprovePlan(deploymentId)` | User | Approve Terraform plan |
| `CreateIncident(alertId)` | System | Auto-create from alert |
| `RunRootCauseAnalysis(incidentId)` | User/System | Trigger AI RCA |
| `GenerateRecommendation(resourceId)` | System | Generate optimization |
| `SetBudget(budget)` | User | Configure budget |
| `PublishCatalogItem(catalogItemId)` | User | Publish to catalog |
