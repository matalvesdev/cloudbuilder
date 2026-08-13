package scheduler

import (
	"context"
	"sync"
	"time"
)

// JobPriority defines the priority of a job.
type JobPriority int

const (
	PriorityHigh   JobPriority = 100
	PriorityMedium JobPriority = 50
	PriorityLow    JobPriority = 10
)

// JobStatus represents the current state of a job.
type JobStatus string

const (
	JobPending   JobStatus = "PENDING"
	JobRunning   JobStatus = "RUNNING"
	JobCompleted JobStatus = "COMPLETED"
	JobFailed    JobStatus = "FAILED"
	JobDelayed   JobStatus = "DELAYED"
	JobRetrying  JobStatus = "RETRYING"
	JobDead      JobStatus = "DEAD"
)

// Job represents a unit of work to be executed.
type Job struct {
	ID          string            `json:"id"`
	Type        string            `json:"type"`
	Payload     map[string]string `json:"payload"`
	Priority    JobPriority       `json:"priority"`
	Status      JobStatus         `json:"status"`
	RetryCount  int               `json:"retryCount"`
	MaxRetries  int               `json:"maxRetries"`
	CreatedAt   time.Time         `json:"createdAt"`
	ScheduledAt time.Time         `json:"scheduledAt"`
	StartedAt   *time.Time        `json:"startedAt,omitempty"`
	CompletedAt *time.Time        `json:"completedAt,omitempty"`
	Error       string            `json:"error,omitempty"`
}

// JobHandler is a function that processes a job.
type JobHandler func(ctx context.Context, job *Job) error

// Scheduler manages job queues and dispatches work to workers.
type Scheduler struct {
	mu       sync.RWMutex
	handlers map[string]JobHandler
	pending  []*Job
	retry    []*Job
	delayed  []*Job
	dlq      []*Job
	running  map[string]*Job
}

// NewScheduler creates a new scheduler.
func NewScheduler() *Scheduler {
	return &Scheduler{
		handlers: make(map[string]JobHandler),
		pending:  make([]*Job, 0),
		retry:    make([]*Job, 0),
		delayed:  make([]*Job, 0),
		dlq:      make([]*Job, 0),
		running:  make(map[string]*Job),
	}
}

// RegisterHandler registers a handler for a job type.
func (s *Scheduler) RegisterHandler(jobType string, handler JobHandler) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.handlers[jobType] = handler
}

// Enqueue adds a job to the pending queue.
func (s *Scheduler) Enqueue(job *Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	job.Status = JobPending
	job.CreatedAt = time.Now().UTC()
	s.pending = append(s.pending, job)
}

// EnqueueDelayed adds a job to be executed after a delay.
func (s *Scheduler) EnqueueDelayed(job *Job, delay time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	job.Status = JobDelayed
	job.ScheduledAt = time.Now().UTC().Add(delay)
	s.delayed = append(s.delayed, job)
}

// ProcessNext processes the next pending job.
func (s *Scheduler) ProcessNext(ctx context.Context) error {
	s.mu.Lock()
	job := s.dequeue()
	if job == nil {
		s.mu.Unlock()
		return nil
	}
	s.running[job.ID] = job
	s.mu.Unlock()

	handler, ok := s.handlers[job.Type]
	if !ok {
		s.failJob(job, "no handler registered")
		return nil
	}

	now := time.Now().UTC()
	job.StartedAt = &now
	job.Status = JobRunning

	err := handler(ctx, job)
	if err != nil {
		s.retryOrDeadLetter(job, err)
		return nil
	}

	s.completeJob(job)
	return nil
}

func (s *Scheduler) dequeue() *Job {
	if len(s.pending) == 0 {
		return nil
	}
	job := s.pending[0]
	s.pending = s.pending[1:]
	return job
}

func (s *Scheduler) completeJob(job *Job) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	job.CompletedAt = &now
	job.Status = JobCompleted
	delete(s.running, job.ID)
}

func (s *Scheduler) failJob(job *Job, errMsg string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	job.CompletedAt = &now
	job.Status = JobFailed
	job.Error = errMsg
	delete(s.running, job.ID)
}

func (s *Scheduler) retryOrDeadLetter(job *Job, err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	job.RetryCount++
	job.Error = err.Error()
	delete(s.running, job.ID)

	if job.RetryCount >= job.MaxRetries {
		job.Status = JobDead
		s.dlq = append(s.dlq, job)
		return
	}

	job.Status = JobRetrying
	backoff := time.Duration(job.RetryCount) * time.Second
	job.ScheduledAt = time.Now().UTC().Add(backoff)
	s.retry = append(s.retry, job)
}

// PendingCount returns the number of pending jobs.
func (s *Scheduler) PendingCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.pending)
}

// DLQCount returns the number of dead-letter jobs.
func (s *Scheduler) DLQCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.dlq)
}
