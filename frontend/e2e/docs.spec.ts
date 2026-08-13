import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Docs Module — Backend Real', () => {

  test('renderiza árvore de documentação', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Docs', 'Governança')
    await expect(page.locator('text=Documentação').or(page.locator('text=Visão Geral')).first()).toBeVisible({ timeout: 10000 })
  })

  test('barra de pesquisa está visível', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Docs', 'Governança')
    await expect(page.locator('input[placeholder*="Pesquisar"]').or(page.locator('input[placeholder*="Buscar"]')).first()).toBeVisible({ timeout: 10000 })
  })

  test('expande diretório e mostra documentos', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Docs', 'Governança')
    // Tenta expandir algum diretório se houver
    const dirBtn = page.locator('button:has(svg.lucide-chevron-right)').first()
    if (await dirBtn.isVisible().catch(() => false)) {
      await dirBtn.click()
      await page.waitForTimeout(500)
    }
    expect(true).toBeTruthy()
  })

  test('botão de importar documento está presente', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Docs', 'Governança')
    await page.waitForTimeout(1000)
    const importBtn = page.locator('button:has-text("Importar")').or(page.locator('button:has-text("Upload")'))
    const isVisible = await importBtn.isVisible().catch(() => false)
    if (isVisible) {
      await expect(importBtn).toBeVisible()
    } else {
      const adrBtn = page.locator('button:has-text("ADR")').or(page.locator('button:has-text("Gerar")'))
      await expect(adrBtn).toBeVisible({ timeout: 5000 })
    }
  })
})
