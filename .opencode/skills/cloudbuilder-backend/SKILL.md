---
name: cloudbuilder-backend
description: Use when working on the CloudBuilder Java backend (Java 21, Spring Boot 3.4.4, Spring Modulith, Maven). Covers module structure, entity conventions, REST API patterns, and testing.
license: MIT
compatibility: opencode
metadata:
  stack: backend
  language: java
---

# CloudBuilder Backend

## Stack
- Java 21 + Spring Boot 3.4.4
- Spring Modulith (modular monolith)
- Maven build system
- PostgreSQL (prod), H2 (test)

## Module Structure (Maven submodules)
- `canvas` — Canvas CRUD, node/edge persistence
- `validation` — Design validation rules engine
- `codegen` — Terraform/OpenTofu code generation
- `provision` — Provision orchestration
- `state` — State management and drift detection
- `iam` — Identity, authentication, authorization

## Conventions
- **No Lombok** (JDK 25 incompatibility)
- Explicit getters/setters/constructors on all entities
- Use `@NullMarked` on all packages for nullable annotations
- RESTful API design with Spring Web
- Input validation via Bean Validation (jakarta.validation)
- Integration tests with @SpringBootTest + H2

## Key Patterns
- Modulith: each module owns its domain, exposed via API package
- Events for cross-module communication (Spring's ApplicationEvent)
- Repository pattern with Spring Data JPA
- DTOs for API boundaries
- Service layer with interface + implementation
- Global exception handler (@ControllerAdvice)

## Testing
- JUnit 5 + Mockito for unit tests
- @SpringBootTest for integration tests
- H2 in-memory for test database
- REST Assured or TestRestTemplate for API tests

## API Design
- Base path: `/api/v1/`
- JSON request/response bodies
- Standard error response format:
  ```json
  { "status": 400, "message": "...", "timestamp": "..." }
  ```
