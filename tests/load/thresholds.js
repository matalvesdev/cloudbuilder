// Shared thresholds for k6 tests
// Import into other test files: import { thresholds } from './thresholds.js'

export const standardThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
}

export const stressThresholds = {
  http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  http_req_failed: ['rate<0.15'],
}

export const endpointThresholds = {
  login: { p95: 300 },
  canvasCrud: { p95: 400 },
  costQuery: { p95: 300 },
  componentList: { p95: 200 },
  catalogList: { p95: 200 },
}

// Baseline p95 latencies (seconds) — update after each load test run
export const baselines = {
  'actuator/health': 0.05,
  'auth/login': 0.20,
  'canvas/list': 0.15,
  'canvas/create': 0.25,
  'canvas/validate': 0.30,
  'canvas/generate': 0.40,
  'cost/overview': 0.20,
  'platform/catalog': 0.10,
  'aiops/incidents': 0.15,
  'audit/events': 0.10,
  'component-definitions': 0.10,
}
