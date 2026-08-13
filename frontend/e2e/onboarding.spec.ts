import { test, expect } from '@playwright/test'
import { prepareApp, login } from './helpers'

test.describe('Onboarding — Backend Real', () => {

  test('página de welcome renderiza sem auth', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').or(page.locator('button:has-text("Entrar")')).first()).toBeVisible({ timeout: 8000 })
  })

  test('onboarding welcome tem botões Pular e Começar', async ({ page }) => {
    // Faz login sem pular onboarding — o welcome deve aparecer
    await page.addInitScript(() => {
      localStorage.clear()
      // NÃO seta onboarding-storage — o welcome deve aparecer
      localStorage.setItem('cloudbuilder-active-tenant-id', 'dev-tenant')
    })
    await page.goto('/', { waitUntil: 'networkidle' })

    await page.locator('input[type="email"]').fill('dev@cloudbuilder.com')
    await page.locator('input[type="password"]').fill('qualquer')
    await page.locator('button[type="submit"]:has-text("Entrar")').click()

    await page.waitForTimeout(2000)
    await expect(page.locator('button:has-text("Pular")')).toBeVisible({ timeout: 8000 })
  })

  test('onboarding welcome mostra botão Tour Interativo', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('cloudbuilder-active-tenant-id', 'dev-tenant')
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill('dev@cloudbuilder.com')
    await page.locator('input[type="password"]').fill('qualquer')
    await page.locator('button[type="submit"]:has-text("Entrar")').click()

    await page.waitForTimeout(2000)
    await expect(page.locator('button:has-text("Tour")').first()).toBeVisible({ timeout: 8000 })
  })

  test('gateway setup mostra passo de repositório', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
      localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
        state: { progress: { stage: 'gateway-setup', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
        version: 0,
      }))
      localStorage.setItem('cloudbuilder-active-tenant-id', 'dev-tenant')
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.locator('input[type="email"]').fill('dev@cloudbuilder.com')
    await page.locator('input[type="password"]').fill('qualquer')
    await page.locator('button[type="submit"]:has-text("Entrar")').click()

    await page.waitForTimeout(2000)
    // Gateway setup page — should show repo step
    await expect(page.locator('text=Repositório').or(page.locator('text=GitHub')).first()).toBeVisible({ timeout: 8000 })
  })
})
