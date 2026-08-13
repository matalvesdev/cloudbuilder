import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Modules — Backend Real', () => {

  test('CostModule — renderiza dashboard com custos', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Custos', 'Operações')
    await page.waitForTimeout(2000)
    await expect(page.locator('h1').or(page.locator('text=Custos')).first()).toBeVisible({ timeout: 10000 })
  })

  test('PlatformModule — renderiza catálogo de templates', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Plataforma')
    await expect(page.locator('text=Catálogo').or(page.locator('text=Plataforma')).first()).toBeVisible({ timeout: 10000 })
  })

  test('AIOpsModule — renderiza assistant e incidentes', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'AIOps', 'Operações')
    await expect(page.locator('text=Incidentes').or(page.locator('text=Operações com IA')).first()).toBeVisible({ timeout: 10000 })
  })

  test('ObserveModule — renderiza dashboard de observabilidade', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Observar', 'Operações')
    await expect(page.locator('text=Observar').or(page.locator('text=Observabilidade')).first()).toBeVisible({ timeout: 10000 })
  })

  test('DesignModule — renderiza canvas de design', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    // Design é o módulo padrão, já deve estar visível após login
    await expect(page.locator('.react-flow').or(page.locator('[class*="react-flow"]')).first()).toBeVisible({ timeout: 10000 })
  })

  test('DocsModule — renderiza árvore de documentação', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Docs', 'Governança')
    await page.waitForTimeout(2000)
    await expect(page.locator('text=Documentação').first()).toBeVisible({ timeout: 10000 })
  })
})
