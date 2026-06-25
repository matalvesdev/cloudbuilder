import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {

  test('página de welcome renderiza sem auth', async ({ page }) => {
    // Go to root without auth — should show login
    await page.goto('/')
    await expect(page.locator('h1').or(page.locator('button:has-text("Entrar")')).first()).toBeVisible({ timeout: 8000 })
  })

  test('onboarding welcome tem botões Pular e Começar', async ({ page }) => {
    // Set up fresh state without onboarding skip
    await page.addInitScript(`
      localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
      localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')

      const mockUser = JSON.stringify({
        id: 'dev-user', name: 'Desenvolvedor',
        email: 'dev@cloudbuilder.com', roles: ['ADMIN']
      })

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url || ''
        if (url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
          return new Response(mockUser, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return origFetch(input, init)
      }
    `)
    await page.goto('/')
    await page.waitForTimeout(2000)
    // Should see onboarding (welcome page) since we didn't skip it
    // The welcome page has "Pular onboarding" button
    const skipButton = page.locator('button:has-text("Pular")')
    await expect(skipButton).toBeVisible({ timeout: 8000 })
  })

  test('onboarding welcome mostra botão Tour Interativo', async ({ page }) => {
    await page.addInitScript(`
      localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
      localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')

      const mockUser = JSON.stringify({
        id: 'dev-user', name: 'Desenvolvedor',
        email: 'dev@cloudbuilder.com', roles: ['ADMIN']
      })

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url || ''
        if (url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
          return new Response(mockUser, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return origFetch(input, init)
      }
    `)
    await page.goto('/')
    await page.waitForTimeout(2000)
    // Welcome page shows "Tour Interativo" button
    const tourButton = page.locator('button:has-text("Tour")').first()
    await expect(tourButton).toBeVisible({ timeout: 8000 })
  })

  test('gateway setup mostra passo de repositório', async ({ page }) => {
    // Set onboarding to gateway-setup stage
    await page.addInitScript(`
      localStorage.setItem('cloudbuilder-auth-token', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZXYifQ.fake')
      localStorage.setItem('cloudbuilder-refresh-token', 'fake-refresh')
      localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
        state: { progress: { stage: 'gateway-setup', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
        version: 0,
      }))

      const mockUser = JSON.stringify({
        id: 'dev-user', name: 'Desenvolvedor',
        email: 'dev@cloudbuilder.com', roles: ['ADMIN']
      })

      const origFetch = window.fetch.bind(window)
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url || ''
        if (url.includes('/api/v1/auth/me') || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh')) {
          return new Response(mockUser, {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return origFetch(input, init)
      }
    `)
    await page.goto('/')
    await page.waitForTimeout(2000)
    // Gateway setup page — should show repo step (GitHub/GitLab/etc.)
    await expect(page.locator('text=Repositório').or(page.locator('text=GitHub')).first()).toBeVisible({ timeout: 8000 })
  })
})
