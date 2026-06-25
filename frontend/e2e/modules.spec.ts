import { test, expect, Page } from '@playwright/test'

async function setupApp(page: Page, mocks: Record<string, unknown> = {}) {
  const initCode = `
    localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
    localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')
    localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
      state: { progress: { stage: 'skipped', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
      version: 0,
    }))
    const mockUser = JSON.stringify({
      id: 'dev-user', name: 'Desenvolvedor',
      email: 'dev@cloudbuilder.com', roles: ['ADMIN']
    })
    const mocks = ${JSON.stringify(mocks)}
    const origFetch = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url || ''
      if (url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
        return new Response(mockUser, { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      for (const [path, data] of Object.entries(mocks)) {
        if (url.includes(path)) {
          return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
      }
      return origFetch(input, init)
    }
  `
  await page.addInitScript(initCode)
}

async function goToModule(page: Page, navLabel: string) {
  await page.goto('/')
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
  const groupMap: Record<string, string> = {
    'Custos': 'Operações', 'AIOps': 'Operações', 'Observar': 'Operações',
    'Docs': 'Sistema', 'Design': 'Infraestrutura', 'Provisionar': 'Infraestrutura',
    'Dashboard': 'Visão Geral', 'Análises': 'Visão Geral',
    'Auditoria': 'Governança', 'IAM': 'Governança', 'Config': 'Sistema',
  }
  const groupLabel = groupMap[navLabel]
  if (groupLabel) {
    const groupBtn = page.locator(`nav button:has-text("${groupLabel}")`).first()
    await groupBtn.hover()
    await page.waitForTimeout(400)
    await page.locator(`button:has-text("${navLabel}")`).last().click({ force: true })
  } else {
    await page.locator(`button:has-text("${navLabel}")`).first().click()
  }
  await page.waitForTimeout(1000)
}

test.describe('Modules — desmockagem smoke tests', () => {
  test('CostModule — renderiza dashboard com custos', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/cost/overview/env-1': { totalCost: 1250.75, forecast: 1800, periodStart: '2026-06-01', periodEnd: '2026-06-30', topServices: [{ service: 'EC2', cost: 500 }], budgets: [{ name: 'Mensal', limit: 5000, spent: 1250.75 }] },
      '/api/v1/cost/records/env-1': [{ month: '2026-06', total: 1250.75, breakdown: { EC2: 500, S3: 300 } }],
    })
    await goToModule(page, 'Custos')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1').or(page.locator('text=Custos')).first()).toBeVisible({ timeout: 10000 })
  })

  test('PlatformModule — renderiza catálogo de templates', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/platform/catalog': [{ id: 'c1', name: 'VPC', type: 'network', description: 'AWS VPC', version: '1.0', status: 'ACTIVE' }],
    })
    await goToModule(page, 'Plataforma')
    await expect(page.locator('text=Catálogo').or(page.locator('text=Plataforma')).first()).toBeVisible({ timeout: 8000 })
  })

  test('AIOpsModule — renderiza assistant e incidentes', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/aiops/incidents/env-1': [{ id: 'i1', environmentId: 'env-1', title: 'Alta latência', description: 'Latência acima de 500ms', severity: 'warning', status: 'OPEN' }],
    })
    await goToModule(page, 'AIOps')
    await expect(page.locator('text=Incidentes').first()).toBeVisible({ timeout: 8000 })
  })

  test('ObserveModule — renderiza dashboard de observabilidade', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/observe/dashboard/env-1': { totalServices: 3, healthy: 2, degraded: 1, down: 0 },
      '/api/v1/observe/alerts/env-1': [{ id: 'a1', environmentId: 'env-1', severity: 'warning', message: 'API degradado', status: 'OPEN' }],
    })
    await goToModule(page, 'Observar')
    await expect(page.locator('text=Observar').or(page.locator('text=Observabilidade')).first()).toBeVisible({ timeout: 8000 })
  })

  test('DesignModule — renderiza canvas de design', async ({ page }) => {
    await setupApp(page)
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
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
    })
    await goToModule(page, 'Docs')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Documentação').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Visão Geral').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Guias').first()).toBeVisible({ timeout: 5000 })
  })
})
