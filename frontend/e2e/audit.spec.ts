import { test, expect } from '@playwright/test'
import { setupApp, goToModule } from './helpers'

test.describe('Audit Module', () => {

  test('renderiza página de auditoria com título', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Auditoria')
    await expect(page.locator('h1:has-text("Auditoria")').first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe abas Timeline, Conformidade e Políticas OPA', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/audit/query': [],
      '/api/v1/compliance/score': { overallScore: 85, categoryScores: [] },
      '/api/v1/compliance/evaluate': [],
      '/api/v1/compliance/rules': [],
    })
    await goToModule(page, 'Auditoria')
    await page.waitForTimeout(2000)
    // Audit module has Timeline, Conformidade, and Políticas OPA tabs
    await expect(page.locator('text=Timeline').first()).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Conformidade').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Políticas').first()).toBeVisible({ timeout: 5000 })
  })

  test('alterna para aba Conformidade', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/audit/query': [],
      '/api/v1/compliance/score': { overallScore: 85, categoryScores: [] },
      '/api/v1/compliance/evaluate': [],
      '/api/v1/compliance/rules': [],
    })
    await goToModule(page, 'Auditoria')
    await page.waitForTimeout(2000)
    // Click on Conformidade tab
    await page.locator('text=Conformidade').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Conformidade').first()).toBeVisible({ timeout: 5000 })
  })

  test('alterna para aba Políticas OPA', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/audit/query': [],
      '/api/v1/compliance/score': { overallScore: 85, categoryScores: [] },
      '/api/v1/compliance/evaluate': [],
      '/api/v1/compliance/rules': [],
    })
    await goToModule(page, 'Auditoria')
    await page.waitForTimeout(2000)
    // Click on Políticas OPA tab
    await page.locator('text=Políticas').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Políticas').first()).toBeVisible({ timeout: 5000 })
  })
})
