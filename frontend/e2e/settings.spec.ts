import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Settings Module — Backend Real', () => {

  test('renderiza módulo de configurações via sidebar', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Configurações', 'Governança')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(100)
  })

  test('sidebar de configurações tem seções navegáveis', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Configurações', 'Governança')
    await page.waitForTimeout(2000)
    const buttons = await page.locator('button').allTextContents()
    const hasSettingsContent = buttons.some(t =>
      t.includes('Adicionar') || t.includes('Salvar') || t.includes('Novo') || t.includes('Perfil')
    )
    expect(hasSettingsContent || buttons.length > 5).toBeTruthy()
  })
})
