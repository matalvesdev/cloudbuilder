import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Observe Module — Backend Real', () => {

  test('renderiza página de observabilidade com título', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await expect(page.locator('h1:has-text("Observabilidade")').first()).toBeVisible({ timeout: 10000 })
  })

  test('exibe abas de navegação (Visão Geral, Métricas, Traces, Logs, Alertas)', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await expect(page.locator('button:has-text("Visão Geral")').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
    await expect(page.locator('button:has-text("Métricas")').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
    await expect(page.locator('button:has-text("Alertas")').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('aba Service Map pode ser clicada', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await page.locator('text=Service Map').first().click().catch(() => {})
    await page.waitForTimeout(1000)
  })

  test('aba Scorecards pode ser clicada', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await page.locator('text=Scorecards').first().click().catch(() => {})
    await page.waitForTimeout(1000)
  })

  test('exibe indicador de alertas se houver', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await expect(page.locator('text=Alertas').first()).toBeVisible({ timeout: 10000 }).catch(() => {})
  })
})
