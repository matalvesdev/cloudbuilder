// CloudBuilder — k6 Load Test
// Performance baseline for production go-live
// Expected: ~50 concurrent users (public beta)
//
// Usage:
//   k6 run infra/k6/load-test.js
//
// Options:
//   -e BASE_URL=https://app.cloudbuilder.io
//   -e USER_EMAIL=test@cloudbuilder.io
//   -e USER_PASSWORD=test123
//   -e CANVAS_ID=<uuid>
//   -e ENV_ID=<uuid>

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────
const authFailureRate = new Rate('auth_failures');
const canvasCreateRate = new Rate('canvas_creations');
const validateSuccessRate = new Rate('validate_success');
const costLoadTrend = new Trend('cost_overview_ms');
const observeLoadTrend = new Trend('observe_dashboard_ms');
const loginTrend = new Trend('login_ms');
const canvasListTrend = new Trend('canvas_list_ms');
const validateTrend = new Trend('validate_ms');

// ── Configuration ───────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const USER_EMAIL = __ENV.USER_EMAIL || 'admin@cloudbuilder.io';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'admin123';
const CANVAS_ID = __ENV.CANVAS_ID || '00000000-0000-0000-0000-000000000001';
const ENV_ID = __ENV.ENV_ID || '00000000-0000-0000-0000-000000000001';

// ── Stages ──────────────────────────────────────────────────────────────
// Ramp up:      0 → 20 users over 30s
// Sustain:      20 users for 60s
// Spike:        20 → 100 users over 10s
// Sustain:      100 users for 30s
// Ramp down:    100 → 0 users over 30s
export const options = {
  stages: [
    { target: 20, duration: '30s' },    // Ramp up to 20 users
    { target: 20, duration: '60s' },    // Sustain at 20
    { target: 100, duration: '10s' },   // Spike to 100
    { target: 100, duration: '30s' },   // Sustain at 100
    { target: 0, duration: '30s' },     // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: [
      { threshold: 'p(95) < 2000', abortOnFail: true },  // p95 < 2s
      { threshold: 'p(99) < 5000', abortOnFail: true },  // p99 < 5s
    ],
    http_req_failed: [
      { threshold: 'rate < 0.01', abortOnFail: true },   // Error rate < 1%
    ],
    // Endpoint-specific thresholds
    'login_ms': [
      { threshold: 'p(95) < 2000' },
    ],
    'canvas_list_ms': [
      { threshold: 'p(95) < 2000' },
    ],
    'validate_ms': [
      { threshold: 'p(95) < 3000' }, // Validation may take longer
    ],
    'cost_overview_ms': [
      { threshold: 'p(95) < 2000' },
    ],
    'observe_dashboard_ms': [
      { threshold: 'p(95) < 2000' },
    ],
    auth_failures: [
      { threshold: 'rate < 0.01' },
    ],
  },
  // Don't treat non-200 as failure for specific checks
  discardResponseBodies: false,
  // DNS resolution and connection pooling
  dns: {
    ttl: '30s',
    select: 'roundRobin',
    policy: 'any',
  },
};

// ── Shared State ────────────────────────────────────────────────────────
let authToken = '';
let sharedCanvasId = CANVAS_ID;
let sharedEnvId = ENV_ID;

// ── Helper Functions ────────────────────────────────────────────────────

function getHeaders(withAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (withAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

function login() {
  const url = `${API_BASE}/auth/login`;
  const payload = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });

  const res = http.post(url, payload, {
    headers: getHeaders(false),
    tags: { name: 'login' },
  });

  loginTrend.add(res.timings.duration);
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => {
      try {
        const body = JSON.parse(r.body);
        authToken = body.token || body.accessToken || '';
        return authToken.length > 0;
      } catch {
        return false;
      }
    },
  });

  authFailureRate.add(!success);
  if (!success) {
    console.error(`Login failed: ${res.status} ${res.body}`);
  }

  return success;
}

// ── Main Load Test ──────────────────────────────────────────────────────

export default function () {
  // ── Step 1: SPA Homepage ────────────────────────────────────────
  group('Homepage (SPA)', () => {
    const res = http.get(BASE_URL, {
      tags: { name: 'spa_homepage' },
    });
    check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage serves HTML': (r) => r.headers['Content-Type']?.includes('text/html'),
    });
  });

  sleep(1);

  // ── Step 2: Login ────────────────────────────────────────────────
  group('Auth Login', () => {
    if (!login()) {
      // If login fails, skip remaining steps for this VU
      return;
    }
  });

  sleep(1);

  // ── Step 3: List Canvases ────────────────────────────────────────
  group('List Canvases', () => {
    const res = http.get(`${API_BASE}/canvases`, {
      headers: getHeaders(true),
      tags: { name: 'canvases_list' },
    });

    canvasListTrend.add(res.timings.duration);
    check(res, {
      'canvases list status is 200': (r) => r.status === 200,
      'canvases returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
  });

  sleep(1);

  // ── Step 4: Validate Canvas ──────────────────────────────────────
  group('Validate Canvas', () => {
    const validatePayload = JSON.stringify({
      nodes: [
        {
          id: 'test-node-1',
          type: 'aws',
          data: {
            provider: 'aws',
            resourceType: 'aws_vpc',
            label: 'Test VPC',
            properties: { cidr: '10.0.0.0/16' },
          },
          position: { x: 100, y: 100 },
        },
      ],
      edges: [],
    });

    const res = http.post(`${API_BASE}/canvases/${sharedCanvasId}/validate`, validatePayload, {
      headers: getHeaders(true),
      tags: { name: 'canvas_validate' },
    });

    validateTrend.add(res.timings.duration);
    const success = check(res, {
      'validate status is 200': (r) => r.status === 200,
      'validate returns report': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && (body.valid !== undefined || body.errors !== undefined);
        } catch {
          return false;
        }
      },
    });
    validateSuccessRate.add(success);
  });

  sleep(1);

  // ── Step 5: Cost Overview ────────────────────────────────────────
  group('Cost Overview', () => {
    const res = http.get(`${API_BASE}/cost/overview/${sharedEnvId}`, {
      headers: getHeaders(true),
      tags: { name: 'cost_overview' },
    });

    costLoadTrend.add(res.timings.duration);
    check(res, {
      'cost overview status is 200': (r) => r.status === 200,
      'cost returns data': (r) => r.body.length > 10,
    });
  });

  sleep(1);

  // ── Step 6: Observe Dashboard ────────────────────────────────────
  group('Observe Dashboard', () => {
    const res = http.get(`${API_BASE}/observe/dashboard/${sharedEnvId}`, {
      headers: getHeaders(true),
      tags: { name: 'observe_dashboard' },
    });

    observeLoadTrend.add(res.timings.duration);
    check(res, {
      'observe dashboard status is 200': (r) => r.status === 200,
      'observe returns data': (r) => r.body.length > 10,
    });
  });

  // Done — VU will either end or loop depending on duration
}
