import { test, expect } from '@playwright/test'

test.describe('CloudBuilder E2E', () => {
  test('página inicial mostra login quando não autenticado', async ({ page }) => {
    await page.goto('/')
    // SPA renders LoginPage inline — no URL redirect
    await expect(page.getByRole('heading', { name: 'CloudBuilder' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  })

  test('página de login renderiza formulário com email e senha', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  })

  test('navegação para /design mostra login sem auth', async ({ page }) => {
    await page.goto('/design')
    await expect(page.getByRole('heading', { name: 'CloudBuilder' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  })
})
