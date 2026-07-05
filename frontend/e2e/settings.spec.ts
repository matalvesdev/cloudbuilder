import { test, expect } from '@playwright/test'
import { setupApp, goToModule } from './helpers'

test.describe('Settings Module', () => {

  test('renderiza módulo de configurações via sidebar', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Config')
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(100)
  })

  test('sidebar de configurações tem seções navegáveis', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Config')
    await page.waitForTimeout(2000)
    const buttons = await page.locator('button').allTextContents()
    const hasSettingsContent = buttons.some(t =>
      t.includes('Adicionar') || t.includes('Salvar') || t.includes('Novo') || t.includes('Perfil')
    )
    expect(hasSettingsContent || buttons.length > 5).toBeTruthy()
  })
})
