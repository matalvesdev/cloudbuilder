package executor

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
)

type EngineType string

const (
	Terraform EngineType = "terraform"
	OpenTofu  EngineType = "tofu"
)

type Executor struct {
	engine     EngineType
	workDir    string
	binaryPath string
	envVars    []string
}

type ExecutionResult struct {
	Stdout   string
	Stderr   string
	ExitCode int
}

func NewExecutor(engine EngineType, workDir string) *Executor {
	binary := string(engine)
	return &Executor{
		engine:     engine,
		workDir:    workDir,
		binaryPath: binary,
	}
}

func (e *Executor) Init(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "init", "-input=false")
}

func (e *Executor) Validate(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "validate")
}

func (e *Executor) Plan(ctx context.Context, out string) (*ExecutionResult, error) {
	args := []string{"plan", "-input=false", "-no-color"}
	if out != "" {
		args = append(args, "-out="+out)
	}
	return e.run(ctx, args...)
}

func (e *Executor) Apply(ctx context.Context, planFile string) (*ExecutionResult, error) {
	return e.run(ctx, "apply", "-input=false", "-no-color", "-auto-approve", planFile)
}

func (e *Executor) ShowPlan(ctx context.Context, planFile string) (*ExecutionResult, error) {
	return e.run(ctx, "show", "-json", planFile)
}

func (e *Executor) Show(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "show", "-json")
}

func (e *Executor) Destroy(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "destroy", "-input=false", "-no-color", "-auto-approve")
}

func (e *Executor) Output(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "output", "-json")
}

func (e *Executor) WorkspaceList(ctx context.Context) (*ExecutionResult, error) {
	return e.run(ctx, "workspace", "list")
}

func (e *Executor) WorkspaceSelect(ctx context.Context, name string) (*ExecutionResult, error) {
	return e.run(ctx, "workspace", "select", name)
}

func (e *Executor) run(ctx context.Context, args ...string) (*ExecutionResult, error) {
	cmd := exec.CommandContext(ctx, e.binaryPath, args...)
	cmd.Dir = e.workDir
	cmd.Env = append(cmd.Env, e.envVars...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			// CRITICAL FIX: Propagate non-exit errors (binary not found, context cancelled, etc.)
			return &ExecutionResult{
				Stdout:   stdout.String(),
				Stderr:   stderr.String(),
				ExitCode: -1,
			}, fmt.Errorf("executor run failed: %w", err)
		}
	}

	return &ExecutionResult{
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		ExitCode: exitCode,
	}, nil
}

// SetEnv sets additional environment variables for all terraform commands.
func (e *Executor) SetEnv(vars []string) {
	e.envVars = append(e.envVars, vars...)
}

func (e *Executor) GetEngine() EngineType { return e.engine }
func (e *Executor) GetWorkDir() string    { return e.workDir }
