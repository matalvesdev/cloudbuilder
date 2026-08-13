const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // Login
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });
  const ei = await page.$('input[type="email"], input[placeholder*="email"]');
  if (ei) {
    await ei.fill('canvas-test3@cloudbuilder.com');
    const p = await page.$('input[type="password"]');
    if (p) await p.fill('test123');
    const b = await page.$('button:has-text("Entrar")');
    if (b) { await b.click(); await page.waitForTimeout(3000); }
  }
  const sb = await page.$('text=Pular onboarding');
  if (sb) { await sb.click(); await page.waitForTimeout(2000); }
  await page.waitForSelector('.react-flow', { timeout: 10000 });
  console.log('1. Canvas loaded');

  // Helper: add node
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
  console.log('2. Adding VPC...');
  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  console.log('3. Adding Subnet...');
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);

  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1500); }

  // Get node IDs
  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  const leftId = nodeIds[0];
  const rightId = nodeIds[1];

  // Connect them
  const srcHandle = page.locator(`.react-flow__handle[data-nodeid="${leftId}"][data-handlepos="right"]`);
  const tgtHandle = page.locator(`.react-flow__handle[data-nodeid="${rightId}"][data-handlepos="left"]`);
  await srcHandle.dragTo(tgtHandle, { timeout: 5000 });
  await page.waitForTimeout(2000);

  let edgeCount = (await page.$$('.react-flow__edge')).length;
  console.log(`4. Edge created: ${edgeCount === 1 ? '✅' : '❌'}`);
  await page.screenshot({ path: 'test-screenshots/130-before-move.png' });

  // Get edge path position before move
  const edgeBefore = await page.evaluate(() => {
    const path = document.querySelector('.react-flow__edge-path');
    return path ? path.getAttribute('d') : null;
  });
  console.log(`   Edge path before: ${edgeBefore?.substring(0, 50)}...`);

  // Move the LEFT node (VPC) down by dragging it
  console.log('5. Moving VPC node down...');
  const leftNode = page.locator(`.react-flow__node[data-id="${leftId}"]`);
  const leftBox = await leftNode.boundingBox();
  if (leftBox) {
    const startX = leftBox.x + leftBox.width / 2;
    const startY = leftBox.y + leftBox.height / 2;
    const endY = startY + 200; // Move down 200px

    // Drag the node
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(200);
    
    // Move in steps
    for (let i = 1; i <= 15; i++) {
      await page.mouse.move(startX, startY + (endY - startY) * (i / 15));
      await page.waitForTimeout(30);
    }
    
    await page.mouse.up();
    await page.waitForTimeout(1500);
    console.log('   Node moved!');
  }

  // Check edge path after move
  const edgeAfter = await page.evaluate(() => {
    const path = document.querySelector('.react-flow__edge-path');
    return path ? path.getAttribute('d') : null;
  });
  console.log(`   Edge path after: ${edgeAfter?.substring(0, 50)}...`);

  // Verify edge still exists and path changed
  edgeCount = (await page.$$('.react-flow__edge')).length;
  const edgeMoved = edgeBefore !== edgeAfter;
  console.log(`\n6. Results:`);
  console.log(`   Edges: ${edgeCount} ${edgeCount === 1 ? '✅' : '❌'}`);
  console.log(`   Edge path changed: ${edgeMoved ? '✅ YES (edge followed node)' : '❌ NO'}`);

  await page.screenshot({ path: 'test-screenshots/131-after-move.png' });
  console.log('   131-after-move.png');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-screenshots/132-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
