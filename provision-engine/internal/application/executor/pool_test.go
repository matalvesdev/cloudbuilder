package executor

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestNewPool(t *testing.T) {
	handler := func(ctx context.Context, task *Task) (*Result, error) {
		return &Result{TaskID: task.ID, Success: true}, nil
	}
	pool := NewPool(4, handler)
	if pool == nil {
		t.Fatal("NewPool() returned nil")
	}
	pool.Stop()
}

func TestPool_Submit(t *testing.T) {
	var processed atomic.Int32
	handler := func(ctx context.Context, task *Task) (*Result, error) {
		processed.Add(1)
		return &Result{TaskID: task.ID, Success: true}, nil
	}
	pool := NewPool(2, handler)
	defer pool.Stop()

	pool.Submit(&Task{ID: "task-1", Action: "apply"})
	pool.Submit(&Task{ID: "task-2", Action: "apply"})

	// Wait for results
	for i := 0; i < 2; i++ {
		select {
		case <-pool.Results():
		case <-time.After(2 * time.Second):
			t.Fatal("timeout waiting for result")
		}
	}

	if processed.Load() != 2 {
		t.Errorf("expected 2 processed, got %d", processed.Load())
	}
}

func TestPool_Concurrent(t *testing.T) {
	var count atomic.Int32
	handler := func(ctx context.Context, task *Task) (*Result, error) {
		count.Add(1)
		time.Sleep(10 * time.Millisecond)
		return &Result{TaskID: task.ID, Success: true}, nil
	}
	pool := NewPool(4, handler)
	defer pool.Stop()

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			pool.Submit(&Task{ID: "task", Action: "apply"})
		}()
	}

	// Collect all results
	for i := 0; i < 20; i++ {
		select {
		case <-pool.Results():
		case <-time.After(5 * time.Second):
			t.Fatal("timeout waiting for results")
		}
	}
	wg.Wait()

	if count.Load() != 20 {
		t.Errorf("expected 20 processed, got %d", count.Load())
	}
}

func TestPool_HandlerError(t *testing.T) {
	handler := func(ctx context.Context, task *Task) (*Result, error) {
		return nil, &testError{"handler failed"}
	}
	pool := NewPool(1, handler)
	defer pool.Stop()

	pool.Submit(&Task{ID: "task-1", Action: "apply"})

	result := <-pool.Results()
	if result.Success {
		t.Error("expected failure")
	}
	if result.Error == "" {
		t.Error("expected error message")
	}
}

func TestPool_ActiveWorkers(t *testing.T) {
	started := make(chan struct{})
	handler := func(ctx context.Context, task *Task) (*Result, error) {
		started <- struct{}{}
		time.Sleep(50 * time.Millisecond)
		return &Result{TaskID: task.ID, Success: true}, nil
	}
	pool := NewPool(2, handler)
	defer pool.Stop()

	pool.Submit(&Task{ID: "task-1", Action: "apply"})
	<-started

	if pool.ActiveWorkers() != 1 {
		t.Errorf("expected 1 active worker, got %d", pool.ActiveWorkers())
	}
	if pool.IdleWorkers() != 1 {
		t.Errorf("expected 1 idle worker, got %d", pool.IdleWorkers())
	}
}

type testError struct {
	msg string
}

func (e *testError) Error() string { return e.msg }
