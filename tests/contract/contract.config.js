/**
 * CloudBuilder — Pact Contract Test Configuration
 *
 * ADR-036 Layer 6: Contract Testing
 * Consumer-driven contracts between frontend ↔ backend API consumers.
 *
 * Usage:
 *   1. Consumer tests generate pact files → tests/contract/pacts/
 *   2. Provider tests verify backend fulfills the contracts
 *   3. CI step: pact-broker publish / can-i-deploy check
 */

const { versionFromPackageJson } = require("@pact-foundation/pact-core/package.json");

module.exports = {
  // ─── Provider (Backend API) ──────────────────────────────────
  provider: "CloudBuilder-API",
  providerBaseUrl: "http://localhost:8080",

  // ─── Consumer (Frontend SPA) ─────────────────────────────────
  consumers: [
    {
      name: "CloudBuilder-Frontend",
      // Frontend consumes these API domains:
      // /api/v1/canvases, /api/v1/environments, /api/v1/cost,
      // /api/v1/observe, /api/v1/platform, /api/v1/aiops,
      // /api/v1/auth, /api/v1/iam, /api/v1/audit
    },
  ],

  // ─── Pact Broker ─────────────────────────────────────────────
  pactBrokerUrl: process.env.PACT_BROKER_URL || "http://localhost:9292",
  pactBrokerToken: process.env.PACT_BROKER_TOKEN || "",
  publishVerificationResult: process.env.CI === "true",
  providerVersion: process.env.GIT_COMMIT || "0.0.0-dev",
  providerVersionBranch: process.env.GIT_BRANCH || "main",

  // ─── State Handlers ──────────────────────────────────────────
  // Sets up provider state before each interaction
  stateHandlers: {
    "canvas exists": () => {
      // Ensure at least one canvas in the DB for GET /api/v1/canvases/:id
    },
    "user is authenticated": () => {
      // Ensure a valid JWT exists
    },
    "no canvases exist": () => {
      // Truncate canvases table
    },
    "cost data exists for environment": () => {
      // Seed cost records for a given environmentId
    },
  },

  // ─── Pact File Directory ─────────────────────────────────────
  pactFilesOrDirectories: [
    process.env.PACT_DIR || "./tests/contract/pacts",
  ],

  // ─── Log Level ───────────────────────────────────────────────
  logLevel: process.env.LOG_LEVEL || "warn",
};
