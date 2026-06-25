// CloudBuilder — k6 Deploy Scenario
// Simulates a full user journey: login → create canvas → add nodes →
// validate → generate code → deploy
//
// Usage:
//   k6 run infra/k6/scenario-deploy.js
//
// Options:
//   -e BASE_URL=https://app.cloudbuilder.io
//   -e USER_EMAIL=test@cloudbuilder.io
//   -e USER_PASSWORD=test123

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────
const journeyDuration = new Trend('journey_total_ms');
const stepLogin = new Trend('step_login_ms');
const stepCreateCanvas = new Trend('step_create_canvas_ms');
const stepAddNodes = new Trend('step_add_nodes_ms');
const stepValidate = new Trend('step_validate_ms');
const stepGenerate = new Trend('step_generate_ms');
const stepDeploy = new Trend('step_deploy_ms');

const canvasesCreated = new Counter('canvases_created');
const deploymentsDone = new Counter('deployments_done');
const journeysCompleted = new Counter('journeys_completed');
const journeysFailed = new Counter('journeys_failed');

// ── Configuration ───────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const USER_EMAIL = __ENV.USER_EMAIL || 'admin@cloudbuilder.io';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'admin123';

export const options = {
  // 10 virtual users, 1 iteration each = 10 complete journeys
  vus: 10,
  iterations: 10,
  thresholds: {
    http_req_duration: ['p(95) < 5000'],
    http_req_failed: ['rate < 0.05'],
    journey_total_ms: ['p(95) < 30000'], // Whole journey < 30s
  },
};

// ── Helper Functions ────────────────────────────────────────────────────

function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function randomThinkTime() {
  // Random think time between 1 and 3 seconds
  sleep(1 + Math.random() * 2);
}

// ── Scenario ────────────────────────────────────────────────────────────

export default function () {
  const journeyStart = Date.now();
  let token = '';
  let canvasId = '';
  let deployId = '';

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Login
    // ═══════════════════════════════════════════════════════════════
    let stepStart = Date.now();
    let res = http.post(`${API_BASE}/auth/login`, JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'login' },
    });
    stepLogin.add(Date.now() - stepStart);

    let success = check(res, {
      'Login successful': (r) => r.status === 200,
    });

    if (!success) {
      console.error(`[STEP 1] Login FAILED: ${res.status} ${res.body}`);
      journeysFailed.add(1);
      return;
    }

    const loginBody = JSON.parse(res.body);
    token = loginBody.token || loginBody.accessToken || '';
    console.log(`[STEP 1] Login OK — token received (${token.substring(0, 12)}...)`);

    randomThinkTime();

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Create Canvas
    // ═══════════════════════════════════════════════════════════════
    stepStart = Date.now();
    const canvasName = `k6-test-${__VU}-${Date.now()}`;
    res = http.post(`${API_BASE}/canvases`, JSON.stringify({
      name: canvasName,
      description: 'Created by k6 deploy scenario test',
      provider: 'aws',
    }), {
      headers: getHeaders(token),
      tags: { name: 'create_canvas' },
    });
    stepCreateCanvas.add(Date.now() - stepStart);

    success = check(res, {
      'Canvas created': (r) => r.status === 200 || r.status === 201,
    });

    if (!success) {
      console.error(`[STEP 2] Create canvas FAILED: ${res.status} ${res.body}`);
      journeysFailed.add(1);
      return;
    }

    const createBody = JSON.parse(res.body);
    canvasId = createBody.id || '';
    canvasesCreated.add(1);
    console.log(`[STEP 2] Canvas created: ${canvasName} (ID: ${canvasId})`);

    randomThinkTime();

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Add Nodes to Canvas
    // ═══════════════════════════════════════════════════════════════
    stepStart = Date.now();
    const testNodes = [
      {
        id: `vpc-${__VU}`,
        type: 'aws',
        data: {
          provider: 'aws',
          resourceType: 'aws_vpc',
          label: 'MainVPC',
          properties: JSON.stringify({ cidr_block: '10.0.0.0/16' }),
        },
        position: { x: 100, y: 100 },
      },
      {
        id: `subnet-${__VU}`,
        type: 'aws',
        data: {
          provider: 'aws',
          resourceType: 'aws_subnet',
          label: 'PublicSubnet',
          properties: JSON.stringify({
            vpc_id: `vpc-${__VU}`,
            cidr_block: '10.0.1.0/24',
          }),
        },
        position: { x: 350, y: 100 },
      },
    ];

    for (const node of testNodes) {
      res = http.post(`${API_BASE}/canvases/${canvasId}/nodes`, JSON.stringify(node), {
        headers: getHeaders(token),
        tags: { name: 'add_node' },
      });

      check(res, {
        [`Node ${node.id} added`]: (r) => r.status === 200 || r.status === 201,
      });
    }
    stepAddNodes.add(Date.now() - stepStart);
    console.log(`[STEP 3] ${testNodes.length} nodes added to canvas ${canvasId}`);

    randomThinkTime();

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Validate Canvas
    // ═══════════════════════════════════════════════════════════════
    stepStart = Date.now();
    res = http.post(`${API_BASE}/canvases/${canvasId}/validate`, JSON.stringify({
      nodes: testNodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: n.data,
        position: n.position,
      })),
      edges: [],
    }), {
      headers: getHeaders(token),
      tags: { name: 'validate' },
    });
    stepValidate.add(Date.now() - stepStart);

    success = check(res, {
      'Validation passed': (r) => r.status === 200,
    });

    if (!success) {
      console.warn(`[STEP 4] Validation warnings: ${res.status} ${res.body}`);
      // Continue anyway — validation may have warnings but still pass
    } else {
      console.log(`[STEP 4] Canvas validated successfully`);
    }

    randomThinkTime();

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Generate Terraform Code
    // ═══════════════════════════════════════════════════════════════
    stepStart = Date.now();
    res = http.post(`${API_BASE}/canvases/${canvasId}/generate`, JSON.stringify({
      format: 'terraform',
      provider: 'aws',
    }), {
      headers: getHeaders(token),
      tags: { name: 'generate_code' },
    });
    stepGenerate.add(Date.now() - stepStart);

    success = check(res, {
      'Code generated': (r) => r.status === 200,
      'Generated code is not empty': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.code && body.code.length > 0;
        } catch {
          return r.body && r.body.length > 100;
        }
      },
    });

    if (!success) {
      console.error(`[STEP 5] Code generation FAILED: ${res.status}`);
      journeysFailed.add(1);
      return;
    }
    console.log(`[STEP 5] Terraform code generated for canvas ${canvasId}`);

    randomThinkTime();

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Deploy
    // ═══════════════════════════════════════════════════════════════
    stepStart = Date.now();
    res = http.post(`${API_BASE}/environments`, JSON.stringify({
      name: `k6-env-${__VU}`,
      canvasId: canvasId,
      provider: 'aws',
    }), {
      headers: getHeaders(token),
      tags: { name: 'create_environment' },
    });

    check(res, {
      'Environment created': (r) => r.status === 200 || r.status === 201,
    });

    if (res.status === 200 || res.status === 201) {
      const envB

      const envBody = JSON.parse(res.body);
      deployId = envBody.id || '';

      // Trigger deployment
      res = http.post(`${API_BASE}/environments/${deployId}/deploy`, JSON.stringify({
        canvasId: canvasId,
      }), {
        headers: getHeaders(token),
        tags: { name: 'deploy' },
      });

      success = check(res, {
        'Deployment triggered': (r) => r.status === 200 || r.status === 202,
      });

      if (success) {
        deploymentsDone.add(1);
        console.log(`[STEP 6] Deployment triggered for environment ${deployId}`);
      } else {
        console.warn(`[STEP 6] Deploy trigger returned ${res.status}`);
      }
    }
    stepDeploy.add(Date.now() - stepStart);

    // Journey Complete
    const totalTime = Date.now() - journeyStart;
    journeyDuration.add(totalTime);
    journeysCompleted.add(1);
    console.log(`[DONE] Journey ${__VU} completed in ${totalTime}ms`);

  } catch (err) {
    console.error(`[FATAL] Journey ${__VU} crashed: ${err}`);
    journeysFailed.add(1);
  }
}
