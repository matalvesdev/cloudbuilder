// k6 Smoke Test — CloudBuilder API
// Validates all endpoints respond correctly under minimal load
// Run: k6 run tests/load/smoke.js

import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
}

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  // ─── Health ────────────────────────────────────────
  const health = http.get(`${BASE_URL}/actuator/health`, { headers })
  check(health, { 'health 200': (r) => r.status === 200 })

  // ─── Auth endpoints ────────────────────────────────
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'admin@cloudbuilder.dev', password: 'admin123' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  check(loginRes, {
    'login returns token': (r) => r.status === 200 && r.json('token') !== undefined,
  })

  const token = loginRes.json('token') || AUTH_TOKEN
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  sleep(0.5)

  // ─── Canvas CRUD ───────────────────────────────────
  const listCanvases = http.get(`${BASE_URL}/api/v1/canvases`, { headers: authHeaders })
  check(listCanvases, { 'list canvases 200': (r) => r.status === 200 })

  // ─── Components ────────────────────────────────────
  const listComponents = http.get(`${BASE_URL}/api/v1/component-definitions`, { headers: authHeaders })
  check(listComponents, { 'list components 200': (r) => r.status === 200 })

  // ─── Cost overview (may need environmentId) ────────
  const costOverview = http.get(`${BASE_URL}/api/v1/cost/overview/test-env`, { headers: authHeaders })
  check(costOverview, { 'cost overview responds': (r) => r.status === 200 || r.status === 404 })

  // ─── Platform catalog ──────────────────────────────
  const catalog = http.get(`${BASE_URL}/api/v1/platform/catalog`, { headers: authHeaders })
  check(catalog, { 'catalog 200': (r) => r.status === 200 })

  // ─── AIOps incidents ──────────────────────────────
  const incidents = http.get(`${BASE_URL}/api/v1/aiops/incidents`, { headers: authHeaders })
  check(incidents, { 'incidents 200': (r) => r.status === 200 })

  // ─── Audit events ─────────────────────────────────
  const audit = http.get(`${BASE_URL}/api/v1/audit/events`, { headers: authHeaders })
  check(audit, { 'audit events 200': (r) => r.status === 200 })

  // ─── Metrics ───────────────────────────────────────
  const metrics = http.get(`${BASE_URL}/actuator/metrics`, { headers: authHeaders })
  check(metrics, { 'actuator metrics 200': (r) => r.status === 200 })

  sleep(1)
}
