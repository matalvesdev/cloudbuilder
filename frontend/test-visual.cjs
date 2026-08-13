const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  console.log('1. Opening frontend...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });

  // Check if we're on login page
  const emailInput = await page.$('input[type="email"], input[placeholder*="email"]');
  if (emailInput) {
    console.log('2. Login page — filling credentials...');
    await emailInput.fill('canvas-test3@cloudbuilder.com');
    const pwd = await page.$('input[type="password"]');
    if (pwd) await pwd.fill('test123');
    const btn = await page.$('button:has-text("Entrar")');
    if (btn) { await btn.click(); await page.waitForTimeout(3000); }
  }
  await page.screenshot({ path: 'test-screenshots/10-after-login.png' });
  console.log('   10-after-login.png');

  // Skip onboarding — click "Ir direto para o dashboard" or "Pular onboarding"
  console.log('3. Skipping onboarding...');
  const skipBtn = await page.$('text=Pular onboarding');
  if (skipBtn) {
    await skipBtn.click();
    await page.waitForTimeout(2000);
    console.log('   Clicked "Pular onboarding"');
  } else {
    const dashLink = await page.$('text=Ir direto para o dashboard');
    if (dashLink) {
      await dashLink.click();
      await page.waitForTimeout(2000);
      console.log('   Clicked "Ir direto para o dashboard"');
    }
  }
  await page.screenshot({ path: 'test-screenshots/11-dashboard.png' });
  console.log('   11-dashboard.png');

  // Navigate to Design module via sidebar
  console.log('4. Navigating to Design...');
  // Try finding "Design" in sidebar
  const designBtn = await page.$('button:has-text("Design"), a:has-text("Design"), [data-module="design"]');
  if (designBtn) {
    await designBtn.click();
    await page.waitForTimeout(3000);
    console.log('   Clicked Design button');
  } else {
    // Try clicking sidebar items
    const allButtons = await page.$$('button, a');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('design')) {
        await btn.click();
        console.log(`   Clicked: "${text.trim()}"`);
        await page.waitForTimeout(3000);
        break;
      }
    }
  }
  await page.screenshot({ path: 'test-screenshots/12-canvas.png' });
  console.log('   12-canvas.png');

  // Check for ReactFlow canvas
  const reactFlow = await page.$('.react-flow');
  if (reactFlow) {
    console.log('5. ✅ ReactFlow canvas FOUND!');
  } else {
    console.log('5. ❌ ReactFlow canvas NOT found — checking page content...');
    const bodyText = await page.$eval('body', el => el.innerText.substring(0, 500));
    console.log(`   Body text: ${bodyText.substring(0, 200)}`);
  }

  // Try to add a node via palette
  console.log('6. Testing node palette...');
  const paletteToggle = await page.$('button[title*="paleta"], button[title*="Paleta"]');
  if (paletteToggle) {
    await paletteToggle.click();
    await page.waitForTimeout(1000);
    console.log('   Palette toggled');
    await page.screenshot({ path: 'test-screenshots/13-palette-open.png' });
  }

  // Final state
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-screenshots/14-final.png' });
  console.log('   14-final.png');

  // Console errors
  if (consoleErrors.length > 0) {
    console.log(`\n⚠️ Console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 5).forEach(e => console.log(`   ${e.substring(0, 120)}`));
  } else {
    console.log('\n✅ Zero console errors');
  }

  await browser.close();
})();
