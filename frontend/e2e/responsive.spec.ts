import { test, expect } from '@playwright/test'
import { setupApp } from './helpers'

test.describe('Responsive Design', () => {

  test.describe('viewport 1280px (desktop)', () => {
    test.use({ viewport: { width: 1280, height: 720 } })

    test('header nav visível com todos os grupos', async ({ page }) => {
      await setupApp(page)
      await page.goto('/')
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
      // Nav groups should be visible on desktop
      await expect(page.locator('text=Infraestrutura').first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('viewport 768px (tablet)', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test('layout adapta para tablet', async ({ page }) => {
      await setupApp(page)
      await page.goto('/')
      await page.waitForTimeout(2000)
      // Nav should still be visible on tablet
      const nav = page.locator('nav').first()
      await expect(nav).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('viewport 375px (mobile)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('layout adapta para mobile', async ({ page }) => {
      await setupApp(page)
      await page.goto('/')
      await page.waitForTimeout(2000)
      // On mobile, the nav might be collapsed or still visible
      const nav = page.locator('nav').first()
      const isVisible = await nav.isVisible().catch(() => false)
      // The page should not crash — at least the header should render
      const header = page.locator('header').first()
      await expect(header).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('viewport 1440px (wide desktop)', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('wide layout renderiza sem overflow', async ({ page }) => {
      await setupApp(page)
      await page.goto('/')
      await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 })
      await page.waitForTimeout(1000)
      // Check no horizontal scroll on body
      const overflowX = await page.evaluate(() => document.body.scrollWidth <= document.body.clientWidth)
      expect(overflowX).toBeTruthy()
    })
  })
})
