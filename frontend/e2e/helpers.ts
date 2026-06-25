import { test, expect, Page } from '@playwright/test'

/**
 * Setup auth + mock API responses via fetch override in addInitScript.
 * Also injects CSS to keep dropdown menus always visible for reliable nav.
 */
export async function setupApp(page: Page, mocks: Record<string, unknown> = {}) {
  const initCode = `
    // Auth + env tokens
    localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
    localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')
    localStorage.setItem('cloudbuilder-active-tenant-id', 'tenant-1')
    localStorage.setItem('cloudbuilder-active-environment', 'env-1')
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

    // Inject CSS to force dropdown menus always visible — avoids hover timing issues
    const style = document.createElement('style')
    style.textContent = '.relative.group > .absolute { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; transform: none !important; }'
    document.head.appendChild(style)
  `

  await page.addInitScript(initCode)
}

/**
 * Navigate to a module using the top nav bar.
 * Dropdowns are always visible thanks to CSS injection — just click the button directly.
 */
export async function goToModule(page: Page, navLabel: string) {
  await page.goto('/')
  // Wait for the nav bar to appear (confirms auth succeeded)
  await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })

  // Click the nav button using evaluate (avoids Playwright visibility checks)
  await page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('nav button'))
    const target = buttons.find(b => b.textContent?.trim() === label)
    if (target) target.click()
  }, navLabel)

  // Wait for lazy-loaded module to render + fetch data
  await page.waitForTimeout(3000)
}

/**
 * Get the module title based on module name for assertion.
 */
export function getModuleTitle(moduleId: string): string {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    design: 'Design',
    provision: 'Provisionar',
    observe: 'Observabilidade',
    cost: 'Custos e Otimizações',
    platform: 'Plataforma',
    aiops: 'AIOps',
    audit: 'Auditoria',
    iam: 'IAM',
    docs: 'Documentação',
    settings: 'Configurações',
    analytics: 'Análises',
  }
  return titles[moduleId] || moduleId
}
