package scheduler

import (
	"context"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestNewScheduler(t *testing.T) {
	s := NewScheduler()
	if s == nil {
		t.Fatal("NewScheduler() returned nil")
	}
	if s.PendingCount() != 0 {
		t.Errorf("expected 0 pending, got %d", s.PendingCount())
	}
}

func TestScheduler_Enqueue(t *testing.T) {
	s := NewScheduler()
	job := &Job{
		ID:       "job-1",
		Type:     "test",
		Priority: PriorityHigh,
	}

	s.Enqueue(job)
	if s.PendingCount() != 1 {
		t.Errorf("expected 1 pending, got %d", s.PendingCount())
	}
	if job.Status != JobPending {
		t.Errorf("Status = %q, want %q", job.Status, JobPending)
	}
}

func TestScheduler_ProcessNext_Success(t *testing.T) {
	s := NewScheduler()
	var processed atomic.Bool

	s.RegisterHandler("test", func(ctx context.Context, job *Job) error {
		processed.Store(true)
		return nil
	})

	job := &Job{ID: "job-1", Type: "test", MaxRetries: 3}
	s.Enqueue(job)

	if err := s.ProcessNext(context.Background()); err != nil {
		t.Fatalf("ProcessNext() error = %v", err)
	}

	if !processed.Load() {
		t.Error("handler was not called")
	}
	if job.Status != JobCompleted {
		t.Errorf("Status = %q, want %q", job.Status, JobCompleted)
	}
}

func TestScheduler_ProcessNext_Retry(t *testing.T) {
	s := NewScheduler()
	var attempts atomic.Int32

	s.RegisterHandler("test", func(ctx context.Context, job *Job) error {
		attempts.Add(1)
		return errors.New("transient error")
	})

	job := &Job{ID: "job-1", Type: "test", MaxRetries: 3}
	s.Enqueue(job)

	// First attempt - fails, retries
	s.ProcessNext(context.Background())
	if job.Status != JobRetrying {
		t.Errorf("Status = %q, want %q", job.Status, JobRetrying)
	}
	if s.PendingCount() != 0 {
		t.Errorf("expected 0 pending after retry, got %d", s.PendingCount())
	}

	// Re-enqueue for retry
	s.Enqueue(job)
	s.ProcessNext(context.Background())
	if attempts.Load() != 2 {
		t.Errorf("expected 2 attempts, got %d", attempts.Load())
	}
}

func TestScheduler_ProcessNext_DeadLetter(t *testing.T) {
	s := NewScheduler()
	s.RegisterHandler("test", func(ctx context.Context, job *Job) error {
		return errors.New("permanent error")
	})

	job := &Job{ID: "job-1", Type: "test", MaxRetries: 3}
	s.Enqueue(job)

	// Attempt 1: fails, retryCount=1 < 3, retries
	s.ProcessNext(context.Background())
	s.Enqueue(job)

	// Attempt 2: fails, retryCount=2 < 3, retries
	s.ProcessNext(context.Background())
	s.Enqueue(job)

	// Attempt 3: fails, retryCount=3 >= 3, goes to DLQ
	s.ProcessNext(context.Background())

	if job.Status != JobDead {
		t.Errorf("Status = %q, want %q", job.Status, JobDead)
	}
	if s.DLQCount() != 1 {
		t.Errorf("expected 1 in DLQ, got %d", s.DLQCount())
	}
}

func TestScheduler_ProcessNext_NoHandler(t *testing.T) {
	s := NewScheduler()
	job := &Job{ID: "job-1", Type: "unknown", MaxRetries: 3}
	s.Enqueue(job)

	s.ProcessNext(context.Background())
	if job.Status != JobFailed {
		t.Errorf("Status = %q, want %q", job.Status, JobFailed)
	}
}

func TestScheduler_ProcessNext_Empty(t *testing.T) {
	s := NewScheduler()
	if err := s.ProcessNext(context.Background()); err != nil {
		t.Fatalf("ProcessNext() error = %v", err)
	}
}

func TestScheduler_EnqueueDelayed(t *testing.T) {
	s := NewScheduler()
	job := &Job{ID: "job-1", Type: "test"}
	s.EnqueueDelayed(job, 5*time.Second)

	if job.Status != JobDelayed {
		t.Errorf("Status = %q, want %q", job.Status, JobDelayed)
	}
}

func TestScheduler_Concurrent(t *testing.T) {
	s := NewScheduler()
	var count atomic.Int32

	s.RegisterHandler("test", func(ctx context.Context, job *Job) error {
		count.Add(1)
		return nil
	})

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s.Enqueue(&Job{
				ID:       "job-" + string(rune('A'+i)),
				Type:     "test",
				MaxRetries: 3,
			})
			s.ProcessNext(context.Background())
		}()
	}
	wg.Wait()

	if count.Load() != 10 {
		t.Errorf("expected 10 processed, got %d", count.Load())
	}
}
