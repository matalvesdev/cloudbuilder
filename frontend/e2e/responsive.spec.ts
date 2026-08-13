import { test, expect } from '@playwright/test'
import { prepareApp, login } from './helpers'

test.describe('Responsive Design — Backend Real', () => {

  test.describe('viewport 1280px (desktop)', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('header nav visível com todos os grupos', async ({ page }) => {
      await prepareApp(page)
      await login(page)
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('text=Infraestrutura').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('viewport 768px (tablet)', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test('layout adapta para tablet', async ({ page }) => {
      await prepareApp(page)
      await login(page)
      await page.waitForTimeout(2000)
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('viewport 375px (mobile)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('layout adapta para mobile', async ({ page }) => {
      await prepareApp(page)
      await login(page)
      await page.waitForTimeout(2000)
      const header = page.locator('header').first()
      await expect(header).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('viewport 1440px (wide desktop)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('wide layout renderiza sem overflow', async ({ page }) => {
      await prepareApp(page)
      await login(page)
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      const overflowX = await page.evaluate(() => document.body.scrollWidth <= document.body.clientWidth)
      expect(overflowX).toBeTruthy()
    })
  })
})
