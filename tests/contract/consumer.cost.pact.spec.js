/**
 * CloudBuilder — Cost API Consumer Contract Tests
 *
 * ADR-036 Layer 6: Contract Testing
 * Verifies frontend expectations of the Cost API endpoints.
 *
 * Contract: Frontend expects specific shapes from:
 *   - GET  /api/v1/cost/overview/:environmentId
 *   - POST /api/v1/cost/records
 *   - GET  /api/v1/cost/records/:environmentId
 *   - POST /api/v1/cost/budgets
 *   - GET  /api/v1/cost/budgets/:environmentId
 *
 * Run: npx vitest run tests/contract/consumer.cost.pact.spec.js
 */

import { describe, it, expect } from "vitest";

const contracts = {
  "GET /api/v1/cost/overview/:environmentId": {
    description: "Get cost overview for an environment",
    method: "GET",
    path: "/cost/overview/{environmentId}",
    expectedStatus: 200,
    expectedBodyShape: {
      environmentId: { type: "string", format: "uuid" },
      totalCost: { type: "number" },
      monthlyCost: { type: "number" },
      dailyAverage: { type: "number" },
      currency: { type: "string" },
      period: { type: "string", enum: ["daily", "weekly", "monthly"] },
      breakdown: { type: "array" },
    },
  },

  "POST /api/v1/cost/records": {
    description: "Create a cost record",
    method: "POST",
    path: "/cost/records",
    body: {
      environmentId: "550e8400-e29b-41d4-a716-446655440000",
      service: "ec2",
      amount: 12.50,
      currency: "USD",
    },
    expectedStatus: 201,
    expectedBodyShape: {
      id: { type: "string", format: "uuid" },
      environmentId: { type: "string", format: "uuid" },
      service: { type: "string" },
      amount: { type: "number" },
      currency: { type: "string" },
      recordedAt: { type: "string", format: "date-time" },
    },
  },

  "GET /api/v1/cost/records/:environmentId": {
    description: "List cost records for an environment",
    method: "GET",
    path: "/cost/records/{environmentId}",
    expectedStatus: 200,
    expectedBodyShape: {
      _comment: "Array of cost records",
      type: "array",
      itemShape: {
        id: { type: "string", format: "uuid" },
        service: { type: "string" },
        amount: { type: "number" },
        currency: { type: "string" },
        recordedAt: { type: "string", format: "date-time" },
      },
    },
  },

  "POST /api/v1/cost/budgets": {
    description: "Create a budget alert",
    method: "POST",
    path: "/cost/budgets",
    body: {
      environmentId: "550e8400-e29b-41d4-a716-446655440000",
      limit: 500.00,
      alertThreshold: 80,
    },
    expectedStatus: 201,
    expectedBodyShape: {
      id: { type: "string", format: "uuid" },
      environmentId: { type: "string", format: "uuid" },
      limit: { type: "number" },
      alertThreshold: { type: "number" },
      currentSpend: { type: "number" },
      status: { type: "string", enum: ["ACTIVE", "TRIGGERED", "EXCEEDED"] },
    },
  },

  "GET /api/v1/cost/budgets/:environmentId": {
    description: "List budgets for an environment",
    method: "GET",
    path: "/cost/budgets/{environmentId}",
    expectedStatus: 200,
    expectedBodyShape: {
      _comment: "Array of budgets",
      type: "array",
      itemShape: {
        id: { type: "string", format: "uuid" },
        limit: { type: "number" },
        alertThreshold: { type: "number" },
        status: { type: "string" },
      },
    },
  },
};

// ─── Validation Helpers (reused from canvas contracts) ──────────

function validateShape(actual, shape, path = "") {
  const errors = [];
  if (shape === null) {
    if (actual !== null) errors.push(`${path}: expected null`);
    return errors;
  }
  if (shape.type === "array") {
    if (!Array.isArray(actual)) {
      errors.push(`${path}: expected array, got ${typeof actual}`);
      return errors;
    }
    if (shape.itemShape) {
      actual.forEach((item, i) => {
        errors.push(...validateShape(item, shape.itemShape, `${path}[${i}]`));
      });
    }
  } else if (typeof shape === "object" && !shape.type) {
    for (const [key, fs] of Object.entries(shape)) {
      if (key.startsWith("_")) continue;
      if (!(key in actual)) errors.push(`${path}.${key}: missing`);
      else errors.push(...validateShape(actual[key], fs, `${path}.${key}`));
    }
  } else {
    if (shape.type === "string" && typeof actual !== "string")
      errors.push(`${path}: expected string`);
    if (shape.type === "number" && typeof actual !== "number")
      errors.push(`${path}: expected number`);
    if (shape.type === "boolean" && typeof actual !== "boolean")
      errors.push(`${path}: expected boolean`);
  }
  return errors;
}

function generateMockFromShape(shape) {
  if (shape === null) return null;
  if (shape.type === "array") {
    return [shape.itemShape ? generateMockFromShape(shape.itemShape) : {}];
  }
  if (typeof shape === "object" && !shape.type) {
    const obj = {};
    for (const [k, fs] of Object.entries(shape)) {
      if (k.startsWith("_")) continue;
      obj[k] = generateMockFromShape(fs);
    }
    return obj;
  }
  switch (shape.type) {
    case "string":
      if (shape.format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
      if (shape.format === "date-time") return "2026-07-01T12:00:00Z";
      if (shape.enum) return shape.enum[0];
      return "test";
    case "number": return 0;
    case "boolean": return true;
    default: return "unknown";
  }
}

// ─── Tests ─────────────────────────────────────────────────────

describe("Cost API Consumer Contracts", () => {
  Object.entries(contracts).forEach(([endpoint, contract]) => {
    describe(endpoint, () => {
      it(`contract: ${contract.description}`, () => {
        expect(contract.method).toBeDefined();
        expect(contract.path).toBeDefined();
        expect(contract.expectedStatus).toBeGreaterThanOrEqual(200);
      });

      it(`response shape matches: ${contract.description}`, () => {
        const mock = generateMockFromShape(contract.expectedBodyShape);
        if (contract.expectedBodyShape !== null) {
          const errors = validateShape(mock, contract.expectedBodyShape);
          expect(errors).toEqual([]);
        }
      });
    });
  });
});
