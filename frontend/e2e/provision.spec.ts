import { test, expect } from '@playwright/test'
import { setupApp, goToModule } from './helpers'

test.describe('Provision Module', () => {

  test('renderiza página de provisionamento com título', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Provisionar')
    await expect(page.locator('h1:has-text("Provisionar")').first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe seletor de engine Terraform/OpenTofu', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Provisionar')
    // Engine selector should be visible
    await expect(page.locator('select').or(page.locator('text=Terraform')).first()).toBeVisible({ timeout: 8000 })
  })

  test('exibe área de código com placeholder', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Provisionar')
    // Without a canvas design, should show default message
    await expect(page.locator('text=Nenhum design encontrado').or(page.locator('text=main.tf')).first()).toBeVisible({ timeout: 8000 })
  })

  test('botão Importar Infra está presente quando sem design', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Provisionar')
    // "Importar Infra" button should be visible
    await expect(page.locator('text=Importar Infra').first()).toBeVisible({ timeout: 8000 })
  })

  test('link Ir para Design está presente quando sem design', async ({ page }) => {
    await setupApp(page)
    await goToModule(page, 'Provisionar')
    // Link to go to Design module
    await expect(page.locator('text=Ir para Design').first()).toBeVisible({ timeout: 8000 })
  })
})
