import { test, expect } from '@playwright/test'
import { prepareApp, login, navigateTo } from './helpers'

test.describe('Provision Module — Backend Real', () => {

  test('renderiza página de provisionamento com título', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Provisionar', 'Infraestrutura')
    await expect(page.locator('h1:has-text("Provisionar")').first()).toBeVisible({ timeout: 10000 })
  })

  test('exibe seletor de engine Terraform/OpenTofu', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Provisionar', 'Infraestrutura')
    await expect(page.locator('select').or(page.locator('text=Terraform')).first()).toBeVisible({ timeout: 10000 })
  })

  test('exibe área de código com placeholder', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Provisionar', 'Infraestrutura')
    await expect(page.locator('text=Nenhum design encontrado').or(page.locator('text=main.tf')).first()).toBeVisible({ timeout: 10000 })
  })

  test('botão Importar Infra está presente quando sem design', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Provisionar', 'Infraestrutura')
    await expect(page.locator('text=Importar Infra').first()).toBeVisible({ timeout: 10000 })
  })

  test('link Ir para Design está presente quando sem design', async ({ page }) => {
    await prepareApp(page)
    await login(page)
    await navigateTo(page, 'Provisionar', 'Infraestrutura')
    await expect(page.locator('text=Ir para Design').first()).toBeVisible({ timeout: 10000 })
  })
})
