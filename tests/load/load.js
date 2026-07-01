// k6 Load Test — CloudBuilder API
// Simulates expected production traffic patterns
// Run: k6 run tests/load/load.js

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'

const errorRate = new Rate('errors')
const loginDuration = new Trend('login_duration')
const canvasDuration = new Trend('canvas_duration')
const costDuration = new Trend('cost_duration')

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up
    { duration: '2m', target: 10 },     // sustained load
    { duration: '30s', target: 25 },    // peak
    { duration: '2m', target: 25 },     // sustained peak
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.05'],
    login_duration: ['p(95)<300'],
    canvas_duration: ['p(95)<400'],
    cost_duration: ['p(95)<300'],
  },
}

function getToken() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'loadtest@cloudbuilder.dev', password: 'test123' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  if (res.status === 200) {
    return res.json('token')
  }
  return null
}

export function setup() {
  const token = getToken()
  return { token }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  }

  group('Auth Flow', () => {
    const start = Date.now()
    const res = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'user@example.com', password: 'test123' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    loginDuration.add(Date.now() - start)
    check(res, { 'login success': (r) => r.status === 200 || r.status === 401 }) ||
      errorRate.add(1)
  })

  sleep(0.5)

  group('Canvas Operations', () => {
    const start = Date.now()

    // List canvases
    const list = http.get(`${BASE_URL}/api/v1/canvases`, { headers })
    check(list, { 'list canvases': (r) => r.status === 200 }) || errorRate.add(1)

    // Create canvas
    const create = http.post(
      `${BASE_URL}/api/v1/canvases`,
      JSON.stringify({ name: `Load Test Canvas ${Date.now()}`, description: 'k6 generated' }),
      { headers },
    )
    check(create, { 'create canvas': (r) => r.status === 201 || r.status === 200 }) || errorRate.add(1)

    const canvasId = create.json('id')
    if (canvasId) {
      // Validate
      const validate = http.post(`${BASE_URL}/api/v1/canvases/${canvasId}/validate`, '{}', { headers })
      check(validate, { 'validate canvas': (r) => r.status === 200 }) || errorRate.add(1)

      // Generate code
      const generate = http.post(`${BASE_URL}/api/v1/canvases/${canvasId}/generate`, '{}', { headers })
      check(generate, { 'generate code': (r) => r.status === 200 }) || errorRate.add(1)

      // Delete
      const del = http.del(`${BASE_URL}/api/v1/canvases/${canvasId}`, null, { headers })
      check(del, { 'delete canvas': (r) => r.status === 200 || r.status === 204 }) || errorRate.add(1)
    }

    canvasDuration.add(Date.now() - start)
  })

  sleep(0.3)

  group('Cost Module', () => {
    const start = Date.now()

    const overview = http.get(`${BASE_URL}/api/v1/cost/overview/test-env`, { headers })
    check(overview, { 'cost overview': (r) => r.status === 200 || r.status === 404 }) || errorRate.add(1)

    const budgets = http.get(`${BASE_URL}/api/v1/cost/budgets/test-env`, { headers })
    check(budgets, { 'cost budgets': (r) => r.status === 200 || r.status === 404 }) || errorRate.add(1)

    costDuration.add(Date.now() - start)
  })

  group('Read-Only Endpoints', () => {
    const catalog = http.get(`${BASE_URL}/api/v1/platform/catalog`, { headers })
    check(catalog, { 'catalog': (r) => r.status === 200 }) || errorRate.add(1)

    const incidents = http.get(`${BASE_URL}/api/v1/aiops/incidents`, { headers })
    check(incidents, { 'incidents': (r) => r.status === 200 }) || errorRate.add(1)

    const components = http.get(`${BASE_URL}/api/v1/component-definitions`, { headers })
    check(components, { 'components': (r) => r.status === 200 }) || errorRate.add(1)
  })

  sleep(Math.random() * 2 + 0.5) // 0.5–2.5s think time
}
