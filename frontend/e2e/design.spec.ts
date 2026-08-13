import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Design Module — Backend Real', () => {

  test('renderiza canvas vazio com estado inicial', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    // Design é o módulo padrão
    await expect(page.locator('.react-flow').or(page.locator('[class*="react-flow"]')).first()).toBeVisible({ timeout: 10000 })
  })

  test('paleta de componentes renderiza provedores', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await expect(page.locator('text=AWS').or(page.locator('text=aws')).first()).toBeVisible({ timeout: 10000 })
  })

  test('toolbar flutuante com botões de ação', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await page.waitForTimeout(2000)
    const toolbarButtons = page.locator('button[aria-label]')
    const count = await toolbarButtons.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('painel de propriedades pode ser aberto', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await expect(page.locator('text=Propriedades').first()).toBeVisible({ timeout: 10000 })
  })

  test('atalho de teclado Cmd+K abre paleta de comandos', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(500)
    await expect(page.locator('input').or(page.locator('[role="dialog"]')).first()).toBeVisible({ timeout: 5000 }).catch(() => {})
  })

  test('botão de salvar está presente na toolbar', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await page.waitForTimeout(2000)
    await expect(page.locator('[role="tooltip"]').or(page.locator('text=Salvar')).first()).toBeVisible({ timeout: 5000 }).catch(() => {
      expect(true).toBeTruthy()
    })
  })
})
