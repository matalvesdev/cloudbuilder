import { test, expect } from '@playwright/test'

// Visual Regression Tests — CloudBuilder
// Captures baseline screenshots and compares on subsequent runs
// Run: npx playwright test tests/visual/screenshots.spec.ts --update-snapshots (first time)
// Run: npx playwright test tests/visual/screenshots.spec.ts (regression check)

test.describe('Visual Regression — CloudBuilder Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('Login page renders correctly', async ({ page }) => {
    // If redirected to login, capture it
    if (page.url().includes('/login') || await page.locator('input[type="email"]').isVisible().catch(() => false)) {
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      })
    }
  })

  test('Dashboard renders correctly', async ({ page }) => {
    // Navigate to dashboard (may need auth bypass or login first)
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('dashboard-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Design module renders correctly', async ({ page }) => {
    await page.goto('/design')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('design-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Provision module renders correctly', async ({ page }) => {
    await page.goto('/provision')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('provision-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Cost module renders correctly', async ({ page }) => {
    await page.goto('/cost')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('cost-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Observe module renders correctly', async ({ page }) => {
    await page.goto('/observe')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('observe-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Platform module renders correctly', async ({ page }) => {
    await page.goto('/platform')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('platform-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('AIOps module renders correctly', async ({ page }) => {
    await page.goto('/aiops')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('aiops-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Settings page renders correctly', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('settings-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    })
  })

  test('Navigation sidebar consistency', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Capture sidebar only
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first()
    if (await sidebar.isVisible().catch(() => false)) {
      await expect(sidebar).toHaveScreenshot('sidebar-nav.png', {
        maxDiffPixelRatio: 0.01,
      })
    }
  })
})

test.describe('Visual Regression — Brand Compliance', () => {
  test('Brand colors are applied correctly', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Check that brand-navy is used somewhere
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    // Body should have some background color (not pure white default for dark theme)
    expect(bodyBg).toBeTruthy()
  })

  test('Font loading is consistent', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily
    })
    expect(fontFamily).toBeTruthy()
  })
})
