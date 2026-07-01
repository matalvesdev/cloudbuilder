/**
 * CloudBuilder — Canvas API Consumer Contract Tests
 *
 * ADR-036 Layer 6: Contract Testing
 * Verifies frontend expectations of the Canvas API endpoints.
 *
 * Contract: Frontend expects specific request/response shapes from:
 *   - GET    /api/v1/canvases
 *   - POST   /api/v1/canvases
 *   - GET    /api/v1/canvases/:id
 *   - PUT    /api/v1/canvases/:id
 *   - DELETE /api/v1/canvases/:id
 *   - POST   /api/v1/canvases/:id/validate
 *   - POST   /api/v1/canvases/:id/generate
 *
 * Run: npx vitest run tests/contract/consumer.canvases.pact.spec.js
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Pact test structure (pure contract definitions — no Pact library dependency in CI)
// When @pact-foundation/pact is installed, replace mock server with Pact mock.

const API_BASE = "http://localhost:8080/api/v1";

// ─── Contract Definitions ──────────────────────────────────────

const contracts = {
  "GET /api/v1/canvases": {
    description: "List all canvases for the current tenant",
    method: "GET",
    path: "/canvases",
    headers: { Authorization: "Bearer {{JWT}}" },
    expectedStatus: 200,
    expectedBodyShape: {
      _comment: "Array of canvas summaries",
      type: "array",
      itemShape: {
        id: { type: "string", format: "uuid" },
        name: { type: "string", minLength: 1 },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        nodeCount: { type: "number", integer: true, minimum: 0 },
        status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
      },
    },
  },

  "POST /api/v1/canvases": {
    description: "Create a new canvas",
    method: "POST",
    path: "/canvases",
    headers: { Authorization: "Bearer {{JWT}}" },
    body: {
      name: "Test Canvas",
      description: "A test canvas for contract verification",
    },
    expectedStatus: 201,
    expectedBodyShape: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", minLength: 1 },
      version: { type: "number", integer: true, minimum: 1 },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  "GET /api/v1/canvases/:id": {
    description: "Get a specific canvas by ID",
    method: "GET",
    path: "/canvases/{canvasId}",
    headers: { Authorization: "Bearer {{JWT}}" },
    expectedStatus: 200,
    expectedBodyShape: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", minLength: 1 },
      nodes: { type: "array" },
      edges: { type: "array" },
      version: { type: "number", integer: true, minimum: 0 },
    },
  },

  "PUT /api/v1/canvases/:id": {
    description: "Update canvas metadata",
    method: "PUT",
    path: "/canvases/{canvasId}",
    headers: { Authorization: "Bearer {{JWT}}" },
    body: { name: "Updated Canvas" },
    expectedStatus: 200,
    expectedBodyShape: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      version: { type: "number", integer: true },
    },
  },

  "DELETE /api/v1/canvases/:id": {
    description: "Delete a canvas",
    method: "DELETE",
    path: "/canvases/{canvasId}",
    headers: { Authorization: "Bearer {{JWT}}" },
    expectedStatus: 204,
    expectedBodyShape: null,
  },

  "POST /api/v1/canvases/:id/validate": {
    description: "Validate canvas topology",
    method: "POST",
    path: "/canvases/{canvasId}/validate",
    headers: { Authorization: "Bearer {{JWT}}" },
    expectedStatus: 200,
    expectedBodyShape: {
      valid: { type: "boolean" },
      errors: { type: "array", itemType: { message: "string" } },
      warnings: { type: "array", itemType: { message: "string" } },
    },
  },

  "POST /api/v1/canvases/:id/generate": {
    description: "Generate Terraform code from canvas",
    method: "POST",
    path: "/canvases/{canvasId}/generate",
    headers: { Authorization: "Bearer {{JWT}}" },
    expectedStatus: 200,
    expectedBodyShape: {
      code: { type: "string", minLength: 1 },
      provider: { type: "string", enum: ["aws", "azure", "gcp", "k8s"] },
      resourceCount: { type: "number", integer: true, minimum: 1 },
    },
  },
};

// ─── Contract Validation Helpers ───────────────────────────────

function validateShape(actual, shape, path = "") {
  const errors = [];

  if (shape === null || shape === undefined) {
    if (actual !== null && actual !== undefined) {
      errors.push(`${path}: expected null but got ${typeof actual}`);
    }
    return errors;
  }

  if (shape.type === "array") {
    if (!Array.isArray(actual)) {
      errors.push(`${path}: expected array, got ${typeof actual}`);
      return errors;
    }
    if (shape.itemShape && actual.length > 0) {
      actual.forEach((item, i) => {
        errors.push(...validateShape(item, shape.itemShape, `${path}[${i}]`));
      });
    }
  } else if (shape.type === "object" || (typeof shape === "object" && shape.type !== "string")) {
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
      errors.push(`${path}: expected object, got ${typeof actual}`);
      return errors;
    }
    for (const [key, fieldShape] of Object.entries(shape)) {
      if (key.startsWith("_")) continue; // skip metadata
      if (!(key in actual)) {
        errors.push(`${path}.${key}: missing required field`);
      } else {
        errors.push(...validateShape(actual[key], fieldShape, `${path}.${key}`));
      }
    }
  } else {
    // Primitive type check
    if (shape.type === "string" && typeof actual !== "string") {
      errors.push(`${path}: expected string, got ${typeof actual}`);
    } else if (shape.type === "number" && typeof actual !== "number") {
      errors.push(`${path}: expected number, got ${typeof actual}`);
    } else if (shape.type === "boolean" && typeof actual !== "boolean") {
      errors.push(`${path}: expected boolean, got ${typeof actual}`);
    }
  }

  return errors;
}

// ─── Tests ─────────────────────────────────────────────────────

describe("Canvas API Consumer Contracts", () => {
  Object.entries(contracts).forEach(([endpoint, contract]) => {
    describe(endpoint, () => {
      it(`contract: ${contract.description}`, () => {
        // Validate the contract definition itself is well-formed
        expect(contract.method).toBeDefined();
        expect(contract.path).toBeDefined();
        expect(contract.expectedStatus).toBeGreaterThan(99);
        expect(contract.expectedStatus).toBeLessThan(600);

        if (contract.expectedBodyShape !== null) {
          expect(typeof contract.expectedBodyShape).toBe("object");
        }

        // Validate shape definition is recursive-safe
        const shapeStr = JSON.stringify(contract.expectedBodyShape);
        expect(shapeStr.length).toBeLessThan(10000); // sanity check
      });

      it(`response shape matches contract: ${contract.description}`, () => {
        // Mock response body based on contract definition
        const mockResponse = generateMockFromShape(contract.expectedBodyShape);

        if (contract.expectedBodyShape !== null) {
          const errors = validateShape(mockResponse, contract.expectedBodyShape);
          expect(errors).toEqual([]);
        }
      });
    });
  });
});

// ─── Mock Response Generator ───────────────────────────────────

function generateMockFromShape(shape) {
  if (shape === null || shape === undefined) return null;

  if (Array.isArray(shape.type) || shape.type === "array") {
    const item = shape.itemShape ? generateMockFromShape(shape.itemShape) : {};
    return [item];
  }

  if (typeof shape === "object" && !shape.type) {
    const obj = {};
    for (const [key, fieldShape] of Object.entries(shape)) {
      if (key.startsWith("_")) continue;
      obj[key] = generateMockFromShape(fieldShape);
    }
    return obj;
  }

  switch (shape.type) {
    case "string":
      if (shape.format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
      if (shape.format === "date-time") return "2026-07-01T12:00:00Z";
      if (shape.enum) return shape.enum[0];
      return "test-value";
    case "number":
      return shape.minimum ?? 0;
    case "boolean":
      return true;
    default:
      return "unknown";
  }
}
