---
name: cloudbuilder-engine
description: Use when working on the CloudBuilder Go provision engine (Go 1.22, Terraform/OpenTofu code generation, drift detection). Covers package structure, code generation patterns, and CLI design.
license: MIT
compatibility: opencode
metadata:
  stack: engine
  language: go
---

# CloudBuilder Provision Engine

## Stack
- Go 1.22
- Terraform / OpenTofu code generation
- CLI executable (provision-engine.exe)

## Package Structure
- `executor/` — Terraform/OpenTofu execution (plan, apply, destroy)
- `parser/` — HCL parsing and code generation from visual designs
- `drift/` — Drift detection between desired and actual state

## Conventions
- Standard Go project layout
- No external dependencies for CLI (stdlib + minimal)
- JSON-based IPC with the Java backend
- Error wrapping with `fmt.Errorf("...: %w", err)`
- Context-aware operations (context.Context)

## Key Patterns
- Terraform workspace per design version
- Plan output parsing for structured summaries
- State comparison using Terraform show command
- Idempotent apply operations
- Progress reporting via stdout JSON lines

## CLI Interface
- `provision-engine plan <design-id>` — generate and show plan
- `provision-engine apply <design-id>` — apply infrastructure
- `provision-engine destroy <design-id>` — tear down
- `provision-engine drift <design-id>` — detect drift
- `provision-engine validate <design-id>` — validate HCL

## Output Format
- Machine-readable JSON for backend consumption
- Human-readable colored output for CLI users
- Structured error codes for programmatic handling
