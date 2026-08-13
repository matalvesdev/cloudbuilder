const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Login
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });
  const ei = await page.$('input[type="email"], input[placeholder*="email"]');
  if (ei) { await ei.fill('canvas-test3@cloudbuilder.com'); }
  const pwd = await page.$('input[type="password"]');
  if (pwd) { await pwd.fill('test123'); }
  const btn = await page.$('button:has-text("Entrar")');
  if (btn) { await btn.click(); await page.waitForTimeout(3000); }
  const sb = await page.$('text=Pular onboarding');
  if (sb) { await sb.click(); await page.waitForTimeout(2000); }
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  console.log('1. Canvas loaded');

  async function addNode(label, provider, resourceType, fx, fy) {
    await page.evaluate(({ l, p, r, x, y }) => {
      const rd = document.querySelector('.react-flow__renderer');
      if (!rd) return;
      const dt = new DataTransfer();
      dt.setData('application/reactflow', JSON.stringify({ id: `${p}-${r}-${Date.now()}`, label: l, provider: p, resourceType: r, category: 'network', displayName: l, description: r, properties: {}, validationStatus: 'PENDING' }));
      dt.effectAllowed = 'copy';
      const rc = rd.getBoundingClientRect();
      rd.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: rc.left + x, clientY: rc.top + y, dataTransfer: dt }));
      rd.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX: rc.left + x, clientY: rc.top + y, dataTransfer: dt }));
    }, { l: label, p: provider, r: resourceType, x: fx, y: fy });
    await page.waitForTimeout(800);
  }

  // Add 2 nodes
  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);

  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1500); }

  let nodes = (await page.$$('.react-flow__node')).length;
  console.log(`2. Nodes: ${nodes}`);
  await page.screenshot({ path: 'test-screenshots/150-initial.png' });

  // Select and delete Subnet via keyboard
  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  await page.locator(`.react-flow__node[data-id="${nodeIds[1]}"]`).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1500);
  
  nodes = (await page.$$('.react-flow__node')).length;
  console.log(`3. After Delete: ${nodes} nodes`);
  await page.screenshot({ path: 'test-screenshots/151-after-delete.png' });

  // --- TEST Ctrl+Z (UNDO) ---
  console.log('\n4. Testing Ctrl+Z (undo)...');
  
  // Method 1: Click on body (not ReactFlow) to defocus, then press Ctrl+Z
  await page.click('body', { position: { x: 10, y: 10 } });
  await page.waitForTimeout(200);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(1500);
  
  let afterUndo = (await page.$$('.react-flow__node')).length;
  console.log(`   Method 1 (body focus): ${afterUndo} nodes ${afterUndo === 2 ? '✅' : '❌'}`);

  if (afterUndo !== 2) {
    // Method 2: Click directly on the ReactFlow background
    await page.click('.react-flow__background', { position: { x: 5, y: 5 } });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1500);
    afterUndo = (await page.$$('.react-flow__node')).length;
    console.log(`   Method 2 (background focus): ${afterUndo} nodes ${afterUndo === 2 ? '✅' : '❌'}`);
  }

  if (afterUndo !== 2) {
    // Method 3: Use page.evaluate to dispatch keyboard event
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    });
    await page.waitForTimeout(1500);
    afterUndo = (await page.$$('.react-flow__node')).length;
    console.log(`   Method 3 (dispatchEvent): ${afterUndo} nodes ${afterUndo === 2 ? '✅' : '❌'}`);
  }

  await page.screenshot({ path: 'test-screenshots/152-after-undo.png' });

  // --- TEST Ctrl+Y (REDO) ---
  if (afterUndo === 2) {
    console.log('\n5. Testing Ctrl+Y (redo)...');
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(1500);
    
    let afterRedo = (await page.$$('.react-flow__node')).length;
    console.log(`   Ctrl+Y (body focus): ${afterRedo} nodes ${afterRedo === 1 ? '✅' : '❌'}`);

    if (afterRedo !== 1) {
      await page.keyboard.press('Control+Shift+z');
      await page.waitForTimeout(1500);
      afterRedo = (await page.$$('.react-flow__node')).length;
      console.log(`   Ctrl+Shift+Z: ${afterRedo} nodes ${afterRedo === 1 ? '✅' : '❌'}`);
    }

    if (afterRedo !== 1) {
      await page.evaluate(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true }));
      });
      await page.waitForTimeout(1500);
      afterRedo = (await page.$$('.react-flow__node')).length;
      console.log(`   dispatchEvent: ${afterRedo} nodes ${afterRedo === 1 ? '✅' : '❌'}`);
    }

    await page.screenshot({ path: 'test-screenshots/153-after-redo.png' });
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-screenshots/154-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
