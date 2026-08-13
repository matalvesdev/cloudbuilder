package drift

import (
	"context"
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/domain/plugin"
	"github.com/cloudbuilder/provision-engine/internal/domain/resource"
	"github.com/cloudbuilder/provision-engine/internal/domain/state"
)

// Detector monitors infrastructure for configuration drift.
type Detector struct {
	resourceRepo resource.Repository
	stateRepo    state.Repository
	registry     *plugin.Registry
}

// NewDetector creates a new drift detector.
func NewDetector(
	resRepo resource.Repository,
	stateRepo state.Repository,
	registry *plugin.Registry,
) *Detector {
	return &Detector{
		resourceRepo: resRepo,
		stateRepo:    stateRepo,
		registry:     registry,
	}
}

// DetectDrift checks all resources for drift.
func (d *Detector) DetectDrift(ctx context.Context) ([]DriftReport, error) {
	resources, err := d.resourceRepo.ListByState(ctx, resource.RStateActive)
	if err != nil {
		return nil, fmt.Errorf("list active resources: %w", err)
	}

	var reports []DriftReport
	for _, res := range resources {
		report, err := d.checkResource(ctx, res)
		if err != nil {
			continue
		}
		if report.HasDrift {
			reports = append(reports, *report)
		}
	}
	return reports, nil
}

// checkResource checks a single resource for drift.
func (d *Detector) checkResource(ctx context.Context, res *resource.ManagedResource) (*DriftReport, error) {
	execType := plugin.ExecutorType(res.Type)
	exec, ok := d.registry.GetExecutor(execType)
	if !ok {
		return nil, fmt.Errorf("executor not found: %s", execType)
	}

	currentState, err := exec.Refresh(ctx, res.Config["workDir"].(string))
	if err != nil {
		return nil, fmt.Errorf("refresh state: %w", err)
	}

	stateEntry, err := d.stateRepo.GetByResourceID(ctx, res.ID)
	if err != nil {
		return nil, fmt.Errorf("get state: %w", err)
	}

	diffs := stateEntry.ComputeDiff()
	if len(diffs) > 0 {
		res.UpdateState(resource.RStateDrifted)
		_ = d.resourceRepo.Update(ctx, res)

		return &DriftReport{
			ResourceID:    res.ID,
			ResourceName:  res.Name,
			HasDrift:      true,
			Diffs:         diffs,
			CurrentState:  currentState,
		}, nil
	}

	return &DriftReport{ResourceID: res.ID, HasDrift: false}, nil
}

// DriftReport describes drift detection results for a resource.
type DriftReport struct {
	ResourceID   string          `json:"resourceId"`
	ResourceName string          `json:"resourceName"`
	HasDrift     bool            `json:"hasDrift"`
	Diffs        []state.StateDiff `json:"diffs,omitempty"`
	CurrentState string          `json:"currentState,omitempty"`
}
