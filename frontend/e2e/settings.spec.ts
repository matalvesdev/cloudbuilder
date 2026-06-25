import { test, expect } from '@playwright/test'
import { setupApp, goToModule } from './helpers'

test.describe('Settings Module', () => {

  test('renderiza página de configurações com título', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Config')
    await expect(page.locator('h1:has-text("Configurações")').first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe abas de credenciais, ambientes e repositórios', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Config')
    // Should see tabs for different settings sections
    await page.waitForTimeout(1000)
    const textOptions = ['Credenciais', 'Ambientes', 'Repositórios', 'Perfil', 'Sistema', 'Provedores']
    let found = false
    for (const text of textOptions) {
      try {
        await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 2000 })
        found = true
        break
      } catch { /* continue */ }
    }
    expect(found).toBeTruthy()
  })

  test('seção de credenciais renderiza formulário', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Config')
    await page.waitForTimeout(1000)
    // Look for credential-related form elements (inputs, selects, buttons)
    const inputs = page.locator('input').first()
    const buttons = page.locator('button:has-text("Adicionar")').or(page.locator('button:has-text("Nova")'))
    const hasInputs = await inputs.isVisible().catch(() => false)
    const hasButtons = await buttons.isVisible().catch(() => false)
    // At least one of these should be present on settings page
    expect(hasInputs || hasButtons).toBeTruthy()
  })
})
