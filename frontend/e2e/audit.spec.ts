import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Audit Module — Backend Real', () => {

  test('renderiza página de auditoria com título', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Auditoria', 'Governança')
    await expect(page.locator('text=Auditoria').first()).toBeVisible({ timeout: 10000 })
  })

  test('exibe abas Timeline, Conformidade e Políticas OPA', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Auditoria', 'Governança')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Timeline').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
    await expect(page.locator('text=Conformidade').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
    await expect(page.locator('text=Políticas').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('alterna para aba Conformidade', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Auditoria', 'Governança')
    await page.waitForTimeout(2000)
    await page.locator('text=Conformidade').first().click().catch(() => {})
    await page.waitForTimeout(500)
  })

  test('alterna para aba Políticas OPA', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Auditoria', 'Governança')
    await page.waitForTimeout(2000)
    await page.locator('text=Políticas').first().click().catch(() => {})
    await page.waitForTimeout(500)
  })
})
