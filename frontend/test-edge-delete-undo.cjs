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
  const b = await page.$('button:has-text("Entrar")');
  if (b) { await b.click(); await page.waitForTimeout(3000); }
  const sb = await page.$('text=Pular onboarding');
  if (sb) { await sb.click(); await page.waitForTimeout(2000); }
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  console.log('1. Canvas loaded');

  // Helper
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

  // Setup: 2 nodes + 1 edge
  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);

  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1500); }

  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  await page.locator(`.react-flow__handle[data-nodeid="${nodeIds[0]}"][data-handlepos="right"]`).dragTo(
    page.locator(`.react-flow__handle[data-nodeid="${nodeIds[1]}"][data-handlepos="left"]`),
    { timeout: 5000 }
  );
  await page.waitForTimeout(2000);

  let edges = (await page.$$('.react-flow__edge')).length;
  console.log(`2. Setup: ${edges} edge(s)`);
  await page.screenshot({ path: 'test-screenshots/160-before.png' });

  // Select the edge by clicking on it
  console.log('3. Selecting edge...');
  // ReactFlow edges have a wider interaction area (.react-flow__edge-interaction)
  // Let's try clicking on the edge path directly
  const edgeInteraction = await page.$('.react-flow__edge-interaction');
  if (edgeInteraction) {
    await edgeInteraction.click({ force: true });
    await page.waitForTimeout(500);
    console.log('   Edge clicked via interaction area');
  } else {
    // Try clicking on the edge path
    const edgePath = await page.$('path.react-flow__edge-path');
    if (edgePath) {
      await edgePath.click({ force: true });
      await page.waitForTimeout(500);
      console.log('   Edge clicked via path');
    } else {
      console.log('   Edge element not found, trying coordinates...');
      // Get edge midpoint from SVG
      const edgeMid = await page.evaluate(() => {
        const edge = document.querySelector('.react-flow__edge');
        if (!edge) return null;
        const rect = edge.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });
      if (edgeMid) {
        await page.mouse.click(edgeMid.x, edgeMid.y);
        await page.waitForTimeout(500);
        console.log(`   Edge clicked at (${Math.round(edgeMid.x)},${Math.round(edgeMid.y)})`);
      }
    }
  }

  await page.screenshot({ path: 'test-screenshots/161-edge-selected.png' });

  // Check if edge toolbar appeared (type switcher + delete)
  const edgeToolbar = await page.$('.react-flow__edge.selected');
  console.log(`   Edge selected: ${!!edgeToolbar}`);

  // Press Delete to remove edge
  console.log('4. Pressing Delete...');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1500);

  edges = (await page.$$('.react-flow__edge')).length;
  let nodes = (await page.$$('.react-flow__node')).length;
  console.log(`   After delete: ${edges} edges, ${nodes} nodes`);
  await page.screenshot({ path: 'test-screenshots/162-edge-deleted.png' });

  const edgeDeleted = edges === 0 && nodes === 2;
  console.log(`   Edge removed: ${edgeDeleted ? '✅' : '❌'}`);

  // Test Undo (Ctrl+Z)
  if (edgeDeleted) {
    console.log('5. Testing Ctrl+Z (undo)...');
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1500);

    edges = (await page.$$('.react-flow__edge')).length;
    nodes = (await page.$$('.react-flow__node')).length;
    console.log(`   After undo: ${edges} edges, ${nodes} nodes`);
    const undoWorked = edges === 1 && nodes === 2;
    console.log(`   Edge restored: ${undoWorked ? '✅' : '❌'}`);
    await page.screenshot({ path: 'test-screenshots/163-undo.png' });

    // Test Redo (Ctrl+Y)
    if (undoWorked) {
      console.log('6. Testing Ctrl+Y (redo)...');
      await page.click('body', { position: { x: 10, y: 10 } });
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(1500);

      edges = (await page.$$('.react-flow__edge')).length;
      nodes = (await page.$$('.react-flow__node')).length;
      console.log(`   After redo: ${edges} edges, ${nodes} nodes`);
      const redoWorked = edges === 0 && nodes === 2;
      console.log(`   Edge re-deleted: ${redoWorked ? '✅' : '❌'}`);
      await page.screenshot({ path: 'test-screenshots/164-redo.png' });
    }
  }

  await page.screenshot({ path: 'test-screenshots/165-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
