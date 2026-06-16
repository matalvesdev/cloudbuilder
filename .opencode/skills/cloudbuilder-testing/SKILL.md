---
name: cloudbuilder-testing
description: Use when writing or running tests for CloudBuilder. Covers frontend (Playwright, Vitest) and backend (JUnit 5, Mockito, Spring Boot Test) testing patterns.
license: MIT
compatibility: opencode
metadata:
  testing: all
---

# CloudBuilder Testing

## Frontend Testing (Playwright + Vitest)

### Tools
- **Playwright** for E2E and component testing
- **Vitest** for unit tests
- Test files co-located with components: `ComponentName.test.tsx`

### Patterns
- Test ReactFlow interactions with mock stores
- Wait for canvas render: `await page.waitForSelector('.react-flow__renderer')`
- Drag-and-drop palette items for node creation
- Snapshot testing for node rendering
- Store unit tests for canvasStore

### Key Scenarios
1. Canvas renders empty state
2. Dragging a component from palette creates a node
3. Nodes can be selected, moved, and deleted
4. Connections between nodes are validated
5. Toolbar actions (save, export, validate) work
6. Properties panel updates on node selection
7. Keyboard shortcuts (⌘K, Delete, ⌘Z) work

## Backend Testing (JUnit 5 + Mockito)

### Tools
- JUnit 5 + Mockito for unit tests
- @SpringBootTest + H2 for integration tests
- TestRestTemplate for API integration tests

### Patterns
- Service layer: mock repositories, test business logic
- Controller layer: @WebMvcTest with mocked services
- Repository layer: @DataJpaTest with H2
- Integration: @SpringBootTest for full context

### Key Scenarios
1. Canvas CRUD operations
2. Validation rules engine
3. Code generation from designs
4. Provision execution flow
5. State drift detection
6. IAM authentication/authorization

## Running Tests
```bash
# Frontend
cd frontend && npm test          # Vitest unit tests
cd frontend && npx playwright test  # E2E tests

# Backend
cd backend && mvn test           # All tests
cd backend && mvn test -pl canvas  # Single module
```
