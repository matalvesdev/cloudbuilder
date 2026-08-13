package planner

import (
	"testing"
)

func TestNewDAG(t *testing.T) {
	dag := NewDAG()
	if dag == nil {
		t.Fatal("NewDAG() returned nil")
	}
}

func TestDAG_AddNode(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a", ResourceType: "vpc"})
	dag.AddNode(&Node{ID: "b", ResourceType: "subnet"})

	if len(dag.nodes) != 2 {
		t.Errorf("expected 2 nodes, got %d", len(dag.nodes))
	}
}

func TestDAG_AddEdge(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})

	if err := dag.AddEdge("b", "a"); err != nil {
		t.Fatalf("AddEdge() error = %v", err)
	}

	if len(dag.edges["a"]) != 1 {
		t.Errorf("expected 1 edge from a, got %d", len(dag.edges["a"]))
	}
}

func TestDAG_AddEdge_NodeNotFound(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})

	if err := dag.AddEdge("b", "a"); err == nil {
		t.Fatal("expected error for nonexistent node")
	}
}

func TestDAG_DetectCycle_NoCycle(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddNode(&Node{ID: "c"})
	dag.AddEdge("b", "a")
	dag.AddEdge("c", "b")

	if dag.DetectCycle() {
		t.Error("expected no cycle")
	}
}

func TestDAG_DetectCycle_WithCycle(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddNode(&Node{ID: "c"})
	dag.AddEdge("b", "a")
	dag.AddEdge("c", "b")
	dag.AddEdge("a", "c") // cycle

	if !dag.DetectCycle() {
		t.Error("expected cycle detected")
	}
}

func TestDAG_TopologicalSort(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddNode(&Node{ID: "c"})
	dag.AddEdge("b", "a")
	dag.AddEdge("c", "b")

	sorted, err := dag.TopologicalSort()
	if err != nil {
		t.Fatalf("TopologicalSort() error = %v", err)
	}

	if len(sorted) != 3 {
		t.Fatalf("expected 3 nodes, got %d", len(sorted))
	}

	// a should come before b, b before c
	indices := map[string]int{}
	for i, n := range sorted {
		indices[n.ID] = i
	}
	if indices["a"] >= indices["b"] {
		t.Error("a should come before b")
	}
	if indices["b"] >= indices["c"] {
		t.Error("b should come before c")
	}
}

func TestDAG_TopologicalSort_Cycle(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddEdge("b", "a")
	dag.AddEdge("a", "b") // cycle

	_, err := dag.TopologicalSort()
	if err == nil {
		t.Fatal("expected error for cycle")
	}
}

func TestDAG_ParallelBatches(t *testing.T) {
	dag := NewDAG()
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddNode(&Node{ID: "c"})
	dag.AddEdge("b", "a")
	dag.AddEdge("c", "a")
	// b and c can run in parallel after a

	batches, err := dag.ParallelBatches()
	if err != nil {
		t.Fatalf("ParallelBatches() error = %v", err)
	}

	if len(batches) != 2 {
		t.Fatalf("expected 2 batches, got %d", len(batches))
	}

	// First batch should have only 'a'
	if len(batches[0]) != 1 || batches[0][0].ID != "a" {
		t.Errorf("first batch should be [a], got %v", batches[0])
	}

	// Second batch should have 'b' and 'c'
	if len(batches[1]) != 2 {
		t.Errorf("second batch should have 2 nodes, got %d", len(batches[1]))
	}
}

func TestDAG_ParallelBatches_Complex(t *testing.T) {
	dag := NewDAG()
	// a → b → d
	// a → c → d
	dag.AddNode(&Node{ID: "a"})
	dag.AddNode(&Node{ID: "b"})
	dag.AddNode(&Node{ID: "c"})
	dag.AddNode(&Node{ID: "d"})
	dag.AddEdge("b", "a")
	dag.AddEdge("c", "a")
	dag.AddEdge("d", "b")
	dag.AddEdge("d", "c")

	batches, err := dag.ParallelBatches()
	if err != nil {
		t.Fatalf("ParallelBatches() error = %v", err)
	}

	if len(batches) != 3 {
		t.Fatalf("expected 3 batches, got %d", len(batches))
	}

	// batch 0: [a], batch 1: [b, c], batch 2: [d]
	if batches[0][0].ID != "a" {
		t.Errorf("batch 0 should be [a], got %v", batches[0])
	}
	if len(batches[1]) != 2 {
		t.Errorf("batch 1 should have 2 nodes, got %d", len(batches[1]))
	}
	if batches[2][0].ID != "d" {
		t.Errorf("batch 2 should be [d], got %v", batches[2])
	}
}

func TestPlanner_GeneratePlan(t *testing.T) {
	p := NewPlanner()
	resources := []ResourceDefinition{
		{ID: "vpc1", Type: "aws_vpc", Provider: "aws"},
		{ID: "sub1", Type: "aws_subnet", Provider: "aws", DependsOn: []string{"vpc1"}},
		{ID: "sg1", Type: "aws_security_group", Provider: "aws", DependsOn: []string{"vpc1"}},
		{ID: "ec2", Type: "aws_instance", Provider: "aws", DependsOn: []string{"sub1", "sg1"}},
	}

	if err := p.BuildGraph(resources); err != nil {
		t.Fatalf("BuildGraph() error = %v", err)
	}

	batches, err := p.GeneratePlan(nil)
	if err != nil {
		t.Fatalf("GeneratePlan() error = %v", err)
	}

	if len(batches) != 3 {
		t.Fatalf("expected 3 batches, got %d", len(batches))
	}
}
