import { test, expect, Page } from '@playwright/test'

/**
 * Setup auth + mock API responses via fetch override in addInitScript.
 * More reliable than page.route() — works before React code runs.
 */
async function setupApp(page: Page, mocks: Record<string, unknown> = {}) {
  const initCode = `
    // Auth token
    localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
    localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')
    // Skip onboarding (zustand/persist key)
    localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
      state: { progress: { stage: 'skipped', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
      version: 0,
    }))

    // Mock user for /auth/me
    const mockUser = JSON.stringify({
      id: 'dev-user', name: 'Desenvolvedor',
      email: 'dev@cloudbuilder.com', roles: ['ADMIN']
    })

    // Mock data for endpoints
    const mocks = ${JSON.stringify(mocks)}

    // Intercept fetch calls
    const origFetch = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url || ''

      // Auth endpoints
      if (url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
        return new Response(mockUser, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Mock data endpoints
      for (const [path, data] of Object.entries(mocks)) {
        if (url.includes(path)) {
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }

      return origFetch(input, init)
    }
  `

  await page.addInitScript(initCode)
}

/** Navigate to a module by clicking its nav button after auth */
async function goToModule(page: Page, navLabel: string) {
  await page.goto('/')
  // Wait for the nav bar to appear (confirms auth succeeded)
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
  // Click the nav button for target module
  await page.locator(`button:has-text("${navLabel}")`).first().click()
  // Wait for lazy-loaded module to render
  await page.waitForTimeout(1000)
}

test.describe('Modules — desmockagem smoke tests', () => {

  test('CostModule — renderiza dashboard com custos', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/cost/overview/env-1': {
        totalCost: 1250.75, monthlyForecast: 1800,
        topServices: [{ name: 'EC2', cost: 500 }],
      },
      '/api/v1/cost/records/env-1': [
        { id: '1', environmentId: 'env-1', provider: 'aws', serviceName: 'EC2', amount: 500, currency: 'USD', date: '2026-06-01' },
        { id: '2', environmentId: 'env-1', provider: 'aws', serviceName: 'S3', amount: 200, currency: 'USD', date: '2026-06-02' },
      ],
      '/api/v1/cost/budgets/env-1': [
        { id: 'b1', environmentId: 'env-1', name: 'Mensal', limitAmount: 5000, currency: 'USD', spentAmount: 1250.75, status: 'ACTIVE' },
      ],
    })
    await goToModule(page, 'Custos')
    await expect(page.locator('text=Custos e Otimizações').first()).toBeVisible({ timeout: 8000 })
  })

  test('PlatformModule — renderiza catálogo de templates', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/platform/catalog': [
        { id: 'c1', name: 'VPC', type: 'network', description: 'AWS VPC', version: '1.0', status: 'ACTIVE' },
        { id: 'c2', name: 'RDS', type: 'database', description: 'AWS RDS', version: '1.0', status: 'ACTIVE' },
      ],
    })
    await goToModule(page, 'Plataforma')
    // The PlatformModule shows the catalog heading
    await expect(page.locator('text=Catálogo').or(page.locator('text=Plataforma')).first()).toBeVisible({ timeout: 8000 })
  })

  test('AIOpsModule — renderiza assistant e incidentes', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/aiops/incidents/env-1': [
        { id: 'i1', environmentId: 'env-1', title: 'Alta latência', description: 'Latência acima de 500ms', severity: 'warning', status: 'OPEN' },
        { id: 'i2', environmentId: 'env-1', title: 'Falha de rede', description: 'Conexão perdida', severity: 'critical', status: 'OPEN' },
      ],
    })
    await goToModule(page, 'AIOps')
    await expect(page.locator('text=Incidentes').first()).toBeVisible({ timeout: 8000 })
  })

  test('ObserveModule — renderiza dashboard de observabilidade', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/observe/dashboard/env-1': {
        totalServices: 3, healthy: 2, degraded: 1, down: 0,
      },
      '/api/v1/observe/alerts/env-1': [
        { id: 'a1', environmentId: 'env-1', severity: 'warning', message: 'API degradado', status: 'OPEN' },
      ],
    })
    await goToModule(page, 'Observar')
    await expect(page.locator('text=Observar').or(page.locator('text=Observabilidade')).first()).toBeVisible({ timeout: 8000 })
  })

  test('DesignModule — renderiza canvas de design', async ({ page }) => {
    await setupApp(page)
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
    // Design is the default active module
    await expect(page.locator('text=Design').or(page.locator('[data-testid*="canvas"]')).first()).toBeVisible({ timeout: 8000 })
  })

  test('DocsModule — renderiza árvore de documentação', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/docs/tree': [
        { name: 'Visão Geral', path: 'overview.md', type: 'directory', title: 'Visão Geral', children: [
          { name: 'Arquitetura', path: 'architecture.md', type: 'directory', title: 'Arquitetura', children: [
            { name: 'ADR-001.md', path: 'adr-001.md', type: 'file', title: 'ADR-001: Decisão Arquitetural' },
          ]},
        ]},
        { name: 'Guias', path: 'guides.md', type: 'directory', title: 'Guias', children: [
          { name: 'Quickstart.md', path: 'quickstart.md', type: 'file', title: 'Quickstart' },
        ]},
      ],
      '/api/v1/docs/content?path=architecture.md': {
        path: 'architecture.md', title: 'Arquitetura do CloudBuilder',
        content: '# Arquitetura\n\n## Stack\n\nBackend em Java 21 + Spring Boot.',
        lastModified: '2026-06-17T10:00:00Z',
      },
      '/api/v1/docs/content?path=adr-001.md': {
        path: 'adr-001.md', title: 'ADR-001: Decisão Arquitetural',
        content: '# ADR-001\n\nDecidimos usar Spring Boot.',
        lastModified: '2026-06-17T10:00:00Z',
      },
    })
    await goToModule(page, 'Docs')
    await expect(page.locator('text=Documentação').first()).toBeVisible({ timeout: 8000 })
    // sidebar tree renders with doc titles
    await expect(page.locator('text=Visão Geral').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Guias').first()).toBeVisible({ timeout: 5000 })
    // expand a folder and click a document
    await page.locator('text=Visão Geral').first().click()
    await expect(page.locator('text=Arquitetura').first()).toBeVisible({ timeout: 5000 })
    await page.locator('text=Arquitetura').first().click()
    await expect(page.locator('text=ADR-001: Decisão Arquitetural').first()).toBeVisible({ timeout: 5000 })
  })
})
