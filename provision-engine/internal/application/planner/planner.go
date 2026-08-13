package planner

import (
	"context"
	"fmt"
	"sort"
)

// Node represents a resource in the dependency graph.
type Node struct {
	ID           string   `json:"id"`
	ResourceType string   `json:"resourceType"`
	DependsOn    []string `json:"dependsOn"`
	Priority     int      `json:"priority"`
}

// DAG is a directed acyclic graph for resource dependency resolution.
type DAG struct {
	nodes map[string]*Node
	edges map[string][]string // parent -> children
}

// NewDAG creates a new directed acyclic graph.
func NewDAG() *DAG {
	return &DAG{
		nodes: make(map[string]*Node),
		edges: make(map[string][]string),
	}
}

// AddNode adds a node to the graph.
func (d *DAG) AddNode(node *Node) {
	d.nodes[node.ID] = node
	if _, ok := d.edges[node.ID]; !ok {
		d.edges[node.ID] = make([]string, 0)
	}
}

// AddEdge adds a dependency edge (from depends on to).
func (d *DAG) AddEdge(from, to string) error {
	if _, ok := d.nodes[from]; !ok {
		return fmt.Errorf("node %s not found", from)
	}
	if _, ok := d.nodes[to]; !ok {
		return fmt.Errorf("node %s not found", to)
	}
	d.edges[to] = append(d.edges[to], from)
	return nil
}

// DetectCycle checks if the graph contains a cycle using DFS.
func (d *DAG) DetectCycle() bool {
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	var dfs func(id string) bool
	dfs = func(id string) bool {
		visited[id] = true
		recStack[id] = true

		for _, child := range d.edges[id] {
			if !visited[child] {
				if dfs(child) {
					return true
				}
			} else if recStack[child] {
				return true
			}
		}
		recStack[id] = false
		return false
	}

	for id := range d.nodes {
		if !visited[id] {
			if dfs(id) {
				return true
			}
		}
	}
	return false
}

// TopologicalSort returns nodes in topological order (dependencies first).
func (d *DAG) TopologicalSort() ([]*Node, error) {
	if d.DetectCycle() {
		return nil, fmt.Errorf("dependency cycle detected")
	}

	inDegree := make(map[string]int)
	for id := range d.nodes {
		inDegree[id] = 0
	}
	for _, children := range d.edges {
		for _, child := range children {
			inDegree[child]++
		}
	}

	var queue []string
	for id, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, id)
		}
	}

	var result []*Node
	for len(queue) > 0 {
		sort.Strings(queue)
		id := queue[0]
		queue = queue[1:]
		result = append(result, d.nodes[id])

		for _, child := range d.edges[id] {
			inDegree[child]--
			if inDegree[child] == 0 {
				queue = append(queue, child)
			}
		}
	}

	return result, nil
}

// ParallelBatches returns groups of nodes that can execute in parallel.
func (d *DAG) ParallelBatches() ([][]*Node, error) {
	sorted, err := d.TopologicalSort()
	if err != nil {
		return nil, err
	}

	// Build reverse edges: child -> parents (dependencies)
	parents := make(map[string][]string)
	for parent, children := range d.edges {
		for _, child := range children {
			parents[child] = append(parents[child], parent)
		}
	}

	completed := make(map[string]bool)
	var batches [][]*Node

	for len(completed) < len(sorted) {
		var batch []*Node
		for _, node := range sorted {
			if completed[node.ID] {
				continue
			}
			// Check both node.DependsOn and reverse edges from the graph
			deps := node.DependsOn
			if fromEdges, ok := parents[node.ID]; ok {
				deps = append(deps, fromEdges...)
			}
			allDepsMet := true
			for _, dep := range deps {
				if !completed[dep] {
					allDepsMet = false
					break
				}
			}
			if allDepsMet {
				batch = append(batch, node)
			}
		}
		if len(batch) == 0 {
			return nil, fmt.Errorf("unable to make progress — possible deadlock")
		}
		for _, node := range batch {
			completed[node.ID] = true
		}
		batches = append(batches, batch)
	}

	return batches, nil
}

// Planner generates execution plans from resource definitions.
type Planner struct {
	dag *DAG
}

// NewPlanner creates a new planner.
func NewPlanner() *Planner {
	return &Planner{dag: NewDAG()}
}

// BuildGraph builds the dependency graph from resource definitions.
func (p *Planner) BuildGraph(resources []ResourceDefinition) error {
	p.dag = NewDAG()
	for _, r := range resources {
		p.dag.AddNode(&Node{
			ID:           r.ID,
			ResourceType: r.Type,
			DependsOn:    r.DependsOn,
			Priority:     r.Priority,
		})
	}
	for _, r := range resources {
		for _, dep := range r.DependsOn {
			if err := p.dag.AddEdge(r.ID, dep); err != nil {
				return err
			}
		}
	}
	return nil
}

// GeneratePlan generates an execution plan with parallel batches.
func (p *Planner) GeneratePlan(ctx context.Context) ([][]*Node, error) {
	return p.dag.ParallelBatches()
}

// ResourceDefinition is an input for plan generation.
type ResourceDefinition struct {
	ID           string            `json:"id"`
	Type         string            `json:"type"`
	Provider     string            `json:"provider"`
	Config       map[string]interface{} `json:"config"`
	DependsOn    []string          `json:"dependsOn,omitempty"`
	Priority     int               `json:"priority,omitempty"`
}
