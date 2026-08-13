package executor

import (
	"context"
	"sync"
	"time"
)

// Worker represents a single execution worker.
type Worker struct {
	ID        int
	busy      bool
	current   string // current job ID
	startedAt time.Time
}

// Pool manages a pool of execution workers.
type Pool struct {
	mu       sync.RWMutex
	workers  []*Worker
	taskChan chan *Task
	resultCh chan *Result
	stopCh   chan struct{}
	ctx      context.Context
	cancel   context.CancelFunc
	stopOnce sync.Once
	wg       sync.WaitGroup
}

// Task represents a unit of execution work.
type Task struct {
	ID           string
	WorkDir      string
	ExecutorType string
	Action       string // plan, apply, destroy
	Payload      map[string]string
}

// Result represents the outcome of a task execution.
type Result struct {
	TaskID  string
	Success bool
	Output  string
	Error   string
}

// Handler processes a task and returns a result.
type Handler func(ctx context.Context, task *Task) (*Result, error)

// NewPool creates a new worker pool with the given size.
func NewPool(size int, handler Handler) *Pool {
	ctx, cancel := context.WithCancel(context.Background())
	p := &Pool{
		workers:  make([]*Worker, size),
		taskChan: make(chan *Task, 100),
		resultCh: make(chan *Result, 100),
		stopCh:   make(chan struct{}),
		ctx:      ctx,
		cancel:   cancel,
	}

	for i := 0; i < size; i++ {
		p.workers[i] = &Worker{ID: i}
		p.wg.Add(1)
		go p.runWorker(i, handler)
	}

	return p
}

func (p *Pool) runWorker(id int, handler Handler) {
	defer p.wg.Done()
	for {
		select {
		case <-p.stopCh:
			return
		case task := <-p.taskChan:
			p.mu.Lock()
			p.workers[id].busy = true
			p.workers[id].current = task.ID
			p.workers[id].startedAt = time.Now().UTC()
			p.mu.Unlock()

			result, err := handler(p.ctx, task)
			if err != nil {
				result = &Result{TaskID: task.ID, Success: false, Error: err.Error()}
			}
			select {
			case p.resultCh <- result:
			case <-p.stopCh:
				return
			}

			p.mu.Lock()
			p.workers[id].busy = false
			p.workers[id].current = ""
			p.mu.Unlock()
		}
	}
}

// Submit adds a task to the worker pool.
func (p *Pool) Submit(task *Task) {
	p.taskChan <- task
}

// Results returns the result channel.
func (p *Pool) Results() <-chan *Result {
	return p.resultCh
}

// Stop gracefully stops all workers.
func (p *Pool) Stop() {
	p.stopOnce.Do(func() {
		p.cancel()
		close(p.stopCh)
		p.wg.Wait()
		close(p.resultCh)
	})
}

// ActiveWorkers returns the number of busy workers.
func (p *Pool) ActiveWorkers() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	count := 0
	for _, w := range p.workers {
		if w.busy {
			count++
		}
	}
	return count
}

// IdleWorkers returns the number of idle workers.
func (p *Pool) IdleWorkers() int {
	return len(p.workers) - p.ActiveWorkers()
}
