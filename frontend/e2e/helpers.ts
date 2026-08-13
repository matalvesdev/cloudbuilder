import { test, expect, Page } from '@playwright/test'

/**
 * Playwright helpers — SEM MOCKS. Todos os testes usam backend real
 * rodando em http://localhost:8080 com profile dev (H2).
 *
 * Uso:
 *   import { prepareApp, login, navigateTo } from './helpers'
 *
 *   test('meu teste', async ({ page }) => {
 *     await prepareApp(page)
 *     await login(page)
 *     await navigateTo(page, 'Design', 'Infraestrutura')
 *     // ... assertions contra backend real
 *   })
 */

/** Tempo limite generoso para operações contra backend real */
export const API_TIMEOUT = 30000

/**
 * Prepara a página limpando localStorage e pulando onboarding.
 * NÃO injeta mocks de fetch — todas as chamadas vão para o backend real.
 */
export async function prepareApp(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
      state: { progress: { stage: 'skipped', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
      version: 0,
    }))
    localStorage.setItem('cloudbuilder-active-tenant-id', 'dev-tenant')
  })
}

/**
 * Faz login via formulário — o DevAuthController aceita qualquer email/senha.
 * Deve ser chamado após prepareApp().
 */
export async function login(page: Page, email = 'dev@cloudbuilder.com', password = 'qualquer') {
  await page.goto('/', { waitUntil: 'networkidle' })

  // Verifica que estamos na página de login
  await expect(page.locator('h1:has-text("CloudBuilder")').first()).toBeVisible({ timeout: 10000 })

  // Preenche formulário
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  await expect(emailInput).toBeVisible({ timeout: 5000 })

  await emailInput.fill(email)
  await passwordInput.fill(password)

  // Clica em "Entrar"
  const submitButton = page.locator('button[type="submit"]:has-text("Entrar")')
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  // Aguarda navegação para o app — o breadcrumb "Dashboard" indica sucesso
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: API_TIMEOUT })
}

/**
 * Navega para um módulo via nav.
 * Grupo dropdown se tiver >1 item, botão direto se for único.
 * @param moduleLabel Rótulo visível do módulo (ex: "Design", "Custos")
 * @param groupLabel Rótulo do grupo dropdown (ex: "Infraestrutura", "Operações")
 */
export async function navigateTo(page: Page, moduleLabel: string, groupLabel?: string) {
  if (groupLabel) {
    // Abre o dropdown do grupo
    const groupBtn = page.locator('nav button', { hasText: groupLabel })
    await expect(groupBtn.first()).toBeVisible({ timeout: 10000 })
    await groupBtn.first().hover()

    // Espera o menu aparecer e clica no item
    await page.waitForTimeout(500)
    const menuItem = page.locator('nav [class*="rounded-xl"][class*="shadow-lg"] button', { hasText: moduleLabel })
    await expect(menuItem.first()).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Fallback: tenta dar click direto no botão do grupo e depois no item
      await groupBtn.first().click()
      await page.waitForTimeout(300)
    })
    await menuItem.first().click()
  } else {
    // Botão direto na nav
    const btn = page.locator('nav button', { hasText: moduleLabel })
    await expect(btn.first()).toBeVisible({ timeout: 10000 })
    await btn.first().click()
  }

  // Aguarda renderização do módulo
  await page.waitForTimeout(2000)
}
