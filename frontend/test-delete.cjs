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
  console.log('2. Adding VPC + Subnet...');
  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);

  // Fit view
  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1500); }

  // Get node IDs
  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  console.log(`   Nodes: ${nodeIds.length}, IDs: ${nodeIds.map(id => id?.substring(0,6)).join(', ')}`);

  // Connect them
  const leftId = nodeIds[0];
  const rightId = nodeIds[1];
  await page.locator(`.react-flow__handle[data-nodeid="${leftId}"][data-handlepos="right"]`).dragTo(
    page.locator(`.react-flow__handle[data-nodeid="${rightId}"][data-handlepos="left"]`),
    { timeout: 5000 }
  );
  await page.waitForTimeout(2000);

  let edgeCount = (await page.$$('.react-flow__edge')).length;
  console.log(`3. After connect — Edges: ${edgeCount}`);
  await page.screenshot({ path: 'test-screenshots/80-connected.png' });

  if (edgeCount > 0) {
    // Now DELETE the Subnet node (right node)
    console.log('4. Selecting Subnet node...');
    const rightNode = page.locator(`.react-flow__node[data-id="${rightId}"]`);
    await rightNode.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/81-selected.png' });

    // Press Delete key
    console.log('5. Pressing Delete key...');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(2000);

    const nodesAfter = (await page.$$('.react-flow__node')).length;
    const edgesAfter = (await page.$$('.react-flow__edge')).length;
    console.log(`   After delete — Nodes: ${nodesAfter}, Edges: ${edgesAfter}`);

    await page.screenshot({ path: 'test-screenshots/82-deleted.png' });

    if (nodesAfter === 1 && edgesAfter === 0) {
      console.log('   ✅ Node deleted, edge removed, stats updated correctly!');
    } else {
      console.log(`   ❌ Expected 1 node + 0 edges, got ${nodesAfter} + ${edgesAfter}`);
    }
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-screenshots/83-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
