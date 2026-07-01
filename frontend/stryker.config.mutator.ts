import type { StrykerOptions } from '@stryker-mutator/api/core'

const config: Partial<StrykerOptions> = {
  // ─── Test Runner ──────────────────────────────────────────────
  testRunner: 'vitest',
  testRunnerNodeArgs: [],

  // ─── Mutate ───────────────────────────────────────────────────
  mutate: [
    'src/store/*.ts',
    'src/lib/*.ts',
    'src/api/*.ts',
    // Exclude test files, types, and generated code
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/**/*.types.ts',
    '!src/types/**',
  ],

  // ─── Coverage Analysis ────────────────────────────────────────
  coverageAnalysis: 'perTest',

  // ─── Thresholds (ADR-036: ≥80% mutation score) ──────────────
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },

  // ─── Mutators ─────────────────────────────────────────────────
  mutators: [
    'arithmetic',
    'boolean-literal',
    'conditional-expression',
    'equality',
    'logical-operator',
    'string-literal',
    'unary-operator',
  ],

  // ─── reporters ────────────────────────────────────────────────
  reporters: ['clear-text', 'html', 'dashboard'],

  // ─── Dashboard ────────────────────────────────────────────────
  dashboard: {
    reportType: 'finished',
  },

  // ─── HTML Reporter ────────────────────────────────────────────
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html',
  },

  // ─── Timeout ──────────────────────────────────────────────────
  timeoutMS: 30000,
  timeoutFactor: 2,

  // ─── Concurrency ──────────────────────────────────────────────
  concurrency: 2,
  concurrencyLogLevel: 'info',

  // ─── Temp Files ───────────────────────────────────────────────
  cleanTempDir: 'always',

  // ─── Logging ──────────────────────────────────────────────────
  logLevel: 'info',
  fileLogLevel: 'off',

  // ─── Vite Config ──────────────────────────────────────────────
  // Use the existing vite config for test runner
  vite: {
    configFile: 'vite.config.ts',
  },
}

export default config
