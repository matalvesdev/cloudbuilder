package state

import (
	"testing"
)

func TestNewStateEntry(t *testing.T) {
	desired := map[string]interface{}{
		"cidr": "10.0.0.0/16",
		"name": "main-vpc",
	}

	s := NewStateEntry("res-1", "dep-1", "tenant-1", desired)
	if s.ID == "" {
		t.Error("expected non-empty ID")
	}
	if s.ResourceID != "res-1" {
		t.Errorf("ResourceID = %q, want %q", s.ResourceID, "res-1")
	}
	if s.Status != Pending {
		t.Errorf("Status = %q, want %q", s.Status, Pending)
	}
	if s.Version != 1 {
		t.Errorf("Version = %d, want 1", s.Version)
	}
	if s.DesiredState["cidr"] != "10.0.0.0/16" {
		t.Errorf("DesiredState[cidr] = %v, want %q", s.DesiredState["cidr"], "10.0.0.0/16")
	}
}

func TestStateEntry_Sync(t *testing.T) {
	s := createTestState(t)
	current := map[string]interface{}{
		"cidr": "10.0.0.0/16",
		"name": "main-vpc",
	}

	s.Sync(current)
	if s.Status != Synced {
		t.Errorf("Status = %q, want %q", s.Status, Synced)
	}
	if s.Version != 2 {
		t.Errorf("Version = %d, want 2", s.Version)
	}
	if s.CurrentState["cidr"] != "10.0.0.0/16" {
		t.Errorf("CurrentState[cidr] = %v", s.CurrentState["cidr"])
	}
}

func TestStateEntry_DetectDrift(t *testing.T) {
	s := createTestState(t)
	s.DetectDrift()

	if s.Status != Drifted {
		t.Errorf("Status = %q, want %q", s.Status, Drifted)
	}
}

func TestStateEntry_Reconcile(t *testing.T) {
	s := createTestState(t)
	s.CurrentState = map[string]interface{}{"cidr": "10.0.1.0/24"}
	s.DetectDrift()
	s.Reconcile()

	if s.Status != Synced {
		t.Errorf("Status = %q, want %q", s.Status, Synced)
	}
	if s.CurrentState["cidr"] != "10.0.0.0/16" {
		t.Errorf("CurrentState[cidr] after reconcile = %v, want %q", s.CurrentState["cidr"], "10.0.0.0/16")
	}
}

func TestStateEntry_ComputeDiff_NoDrift(t *testing.T) {
	s := createTestState(t)
	s.CurrentState = map[string]interface{}{
		"cidr": "10.0.0.0/16",
		"name": "main-vpc",
	}

	diffs := s.ComputeDiff()
	if len(diffs) != 0 {
		t.Errorf("expected 0 diffs, got %d", len(diffs))
	}
}

func TestStateEntry_ComputeDiff_WithDrift(t *testing.T) {
	s := createTestState(t)
	s.CurrentState = map[string]interface{}{
		"cidr": "10.0.1.0/24", // changed
		"name": "main-vpc",
	}

	diffs := s.ComputeDiff()
	if len(diffs) != 1 {
		t.Fatalf("expected 1 diff, got %d", len(diffs))
	}
	if diffs[0].Type != DiffModified {
		t.Errorf("diff type = %q, want %q", diffs[0].Type, DiffModified)
	}
}

func TestStateEntry_ComputeDiff_Added(t *testing.T) {
	s := createTestState(t)
	s.CurrentState = map[string]interface{}{
		"name": "main-vpc",
	}

	diffs := s.ComputeDiff()
	found := false
	for _, d := range diffs {
		if d.Type == DiffAdded {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected ADDED diff for cidr")
	}
}

func TestStateEntry_ComputeDiff_Removed(t *testing.T) {
	s := createTestState(t)
	s.CurrentState = map[string]interface{}{
		"cidr": "10.0.0.0/16",
		"name": "main-vpc",
		"extra": "value",
	}

	diffs := s.ComputeDiff()
	found := false
	for _, d := range diffs {
		if d.Type == DiffRemoved {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected REMOVED diff for extra")
	}
}

func TestStateEntry_ComputeDiff_NilStates(t *testing.T) {
	s := &StateEntry{}
	diffs := s.ComputeDiff()
	if diffs != nil {
		t.Errorf("expected nil diffs for nil states, got %d", len(diffs))
	}
}

func TestCopyMap(t *testing.T) {
	original := map[string]interface{}{
		"key1": "value1",
		"key2": 42,
	}
	copied := copyMap(original)
	copied["key1"] = "modified"

	if original["key1"] != "value1" {
		t.Error("copyMap should not modify original")
	}
}

func createTestState(t *testing.T) *StateEntry {
	t.Helper()
	return NewStateEntry("res-1", "dep-1", "tenant-1", map[string]interface{}{
		"cidr": "10.0.0.0/16",
		"name": "main-vpc",
	})
}
