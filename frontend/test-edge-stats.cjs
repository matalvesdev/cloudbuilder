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

  // Add 2 nodes with big spacing
  console.log('2. Adding VPC...');
  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  console.log('3. Adding Subnet...');
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);

  // Fit view to separate them
  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1500); }

  const nodeCount = (await page.$$('.react-flow__node')).length;
  console.log(`   Nodes: ${nodeCount}`);
  await page.screenshot({ path: 'test-screenshots/120-two-nodes.png' });

  if (nodeCount >= 2) {
    // Get node IDs sorted left to right
    const nodeIds = await page.$$eval('.react-flow__node', els =>
      els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
         .map(el => el.getAttribute('data-id'))
    );
    const leftId = nodeIds[0];
    const rightId = nodeIds[1];

    // Connect: drag from left node's right source handle to right node's left target handle
    const srcHandle = page.locator(`.react-flow__handle[data-nodeid="${leftId}"][data-handlepos="right"]`);
    const tgtHandle = page.locator(`.react-flow__handle[data-nodeid="${rightId}"][data-handlepos="left"]`);

    console.log(`4. Connecting nodes: ${leftId.substring(0,6)} → ${rightId.substring(0,6)}`);
    await srcHandle.dragTo(tgtHandle, { timeout: 5000 });
    await page.waitForTimeout(3000);

    // Verify edge
    const edgeCount = (await page.$$('.react-flow__edge')).length;
    console.log(`5. Edges: ${edgeCount}`);
    await page.screenshot({ path: 'test-screenshots/121-edge-created.png' });

    if (edgeCount > 0) {
      console.log('   ✅ EDGE VISIBLE ON CANVAS');

      // Check stats in the header
      const stats = await page.evaluate(() => {
        const els = document.querySelectorAll('.react-flow__panel');
        for (const el of els) {
          const text = el.textContent || '';
          if (text.includes('nós') || text.includes('edges')) {
            return text.trim().replace(/\s+/g, ' ');
          }
        }
        // Also check the top-right stats area
        const allText = document.body.innerText;
        const match = allText.match(/(\d+)\s*nós\s*·\s*(\d+)\s*edges/);
        if (match) return match[0];
        return null;
      });
      console.log(`   Stats: "${stats}"`);

      if (stats && stats.includes('1 edges')) {
        console.log('   ✅ STATS UPDATED: 1 edge');
      } else {
        console.log(`   Stats text: ${stats}`);
      }

      // Verify cost updated
      const cost = await page.evaluate(() => {
        const els = document.querySelectorAll('*');
        for (const el of els) {
          const t = el.textContent || '';
          if (t.includes('~$') && t.includes('/mo') && !t.includes('Nenhum')) {
            return t.trim();
          }
        }
        return null;
      });
      console.log(`   Cost: "${cost}"`);

      // Verify MiniMap shows 2 nodes + edge
      const minimap = await page.$('.react-flow__minimap');
      console.log(`   MiniMap visible: ${!!minimap}`);
    } else {
      console.log('   ❌ No edge created');
    }
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-screenshots/122-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
