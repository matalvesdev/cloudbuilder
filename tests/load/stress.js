// k6 Stress Test — CloudBuilder API
// Pushes system beyond expected capacity to find breaking points
// Run: k6 run tests/load/stress.js

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080'

const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // warm up
    { duration: '1m', target: 50 },     // normal load
    { duration: '1m', target: 100 },    // stress
    { duration: '2m', target: 100 },    // sustained stress
    { duration: '30s', target: 150 },   // peak stress
    { duration: '1m', target: 150 },    // sustained peak
    { duration: '30s', target: 0 },     // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    errors: ['rate<0.15'],
  },
}

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'admin@cloudbuilder.dev', password: 'admin123' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  return { token: res.json('token') || '' }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  }

  group('Stress: Canvas CRUD', () => {
    const start = Date.now()

    const create = http.post(
      `${BASE_URL}/api/v1/canvases`,
      JSON.stringify({ name: `Stress-${Date.now()}-${__VU}`, description: 'stress test' }),
      { headers },
    )
    check(create, { 'create 2xx': (r) => r.status >= 200 && r.status < 300 }) || errorRate.add(1)

    const list = http.get(`${BASE_URL}/api/v1/canvases`, { headers })
    check(list, { 'list 200': (r) => r.status === 200 }) || errorRate.add(1)

    responseTime.add(Date.now() - start)

    // Cleanup
    const id = create.json('id')
    if (id) {
      http.del(`${BASE_URL}/api/v1/canvases/${id}`, null, { headers })
    }
  })

  group('Stress: Component Definitions', () => {
    const components = http.get(`${BASE_URL}/api/v1/component-definitions`, { headers })
    check(components, { 'components 200': (r) => r.status === 200 }) || errorRate.add(1)
  })

  group('Stress: Read Endpoints', () => {
    const batch = http.batch([
      ['GET', `${BASE_URL}/api/v1/platform/catalog`, null, { headers }],
      ['GET', `${BASE_URL}/api/v1/aiops/incidents`, null, { headers }],
      ['GET', `${BASE_URL}/api/v1/audit/events`, null, { headers }],
      ['GET', `${BASE_URL}/api/v1/cost/overview/test-env`, null, { headers }],
    ])
    for (const res of batch) {
      check(res, { 'read 2xx': (r) => r.status >= 200 && r.status < 500 }) || errorRate.add(1)
    }
  })

  sleep(Math.random() * 1 + 0.2) // 0.2–1.2s think time (shorter than load)
}
