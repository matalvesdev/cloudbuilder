const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // 1. Login
  console.log('1. Login...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });
  const emailInput = await page.$('input[type="email"], input[placeholder*="email"]');
  if (emailInput) {
    await emailInput.fill('canvas-test3@cloudbuilder.com');
    const pwd = await page.$('input[type="password"]');
    if (pwd) await pwd.fill('test123');
    const btn = await page.$('button:has-text("Entrar")');
    if (btn) { await btn.click(); await page.waitForTimeout(3000); }
  }

  // 2. Skip onboarding
  const skipBtn = await page.$('text=Pular onboarding');
  if (skipBtn) { await skipBtn.click(); await page.waitForTimeout(2000); }

  // 3. Wait for canvas
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  console.log('2. Canvas loaded!');

  // 4. Find the first draggable sidebar item (VPC)
  const draggables = await page.$$('[draggable="true"]');
  console.log(`3. Found ${draggables.length} draggable elements`);

  if (draggables.length > 0) {
    const firstDrag = draggables[0];
    const dragText = await firstDrag.textContent();
    console.log(`   First item: "${dragText?.trim().substring(0, 40)}"`);

    // 5. Use Playwright's dragTo with the react-flow renderer as target
    const canvas = await page.$('.react-flow__renderer');
    if (canvas) {
      console.log('4. Using dragTo on react-flow renderer...');
      try {
        await firstDrag.dragTo(canvas, {
          targetPosition: { x: 600, y: 400 }  // Center of canvas
        });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`   dragTo failed: ${e.message}`);
      }

      // Check nodes
      const nodes = await page.$$('.react-flow__node');
      console.log(`5. Nodes after dragTo: ${nodes.length}`);

      if (nodes.length === 0) {
        // Fallback: dispatch a proper React/DragEvent via page.evaluate
        console.log('6. Trying dispatchEvent fallback...');
        await page.evaluate(() => {
          const renderer = document.querySelector('.react-flow__renderer');
          if (!renderer) return;

          const dataTransfer = new DataTransfer();
          dataTransfer.setData('application/reactflow', JSON.stringify({
            id: 'aws-vpc',
            label: 'VPC',
            provider: 'aws',
            resourceType: 'aws_vpc',
            category: 'network',
            displayName: 'VPC',
            description: 'Virtual Private Cloud'
          }));
          dataTransfer.effectAllowed = 'copy';

          const rect = renderer.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Fire dragover first (ReactFlow needs this to set dropEffect)
          const dragOverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            dataTransfer
          });
          renderer.dispatchEvent(dragOverEvent);

          // Then fire drop
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY,
            dataTransfer
          });
          renderer.dispatchEvent(dropEvent);
        });

        await page.waitForTimeout(2000);
        const nodes2 = await page.$$('.react-flow__node');
        console.log(`   Nodes after dispatchEvent: ${nodes2.length}`);
        await page.screenshot({ path: 'test-screenshots/44-after-dispatch.png' });
      }

      // If we have nodes, click one to test selection
      const finalNodes = await page.$$('.react-flow__node');
      if (finalNodes.length > 0) {
        console.log('✅ DRAG AND DROP WORKS!');
        await finalNodes[0].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-screenshots/45-node-selected.png' });
        console.log('   45-node-selected.png');
      }
    }
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-screenshots/46-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
