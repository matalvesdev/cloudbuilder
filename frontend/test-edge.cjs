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
  console.log('Canvas loaded!');

  // Add two nodes with big spacing
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

  await addNode('VPC', 'aws', 'aws_vpc', 100, 300);
  await addNode('Subnet', 'aws', 'aws_subnet', 1400, 300);
  console.log(`Nodes: ${(await page.$$('.react-flow__node')).length}`);

  // Get node IDs in order (left to right)
  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  console.log(`Node IDs (left→right): ${nodeIds.join(', ')}`);

  if (nodeIds.length >= 2) {
    const leftId = nodeIds[0];
    const rightId = nodeIds[1];

    // Find the right-side handle of LEFT node and left-side handle of RIGHT node
    const srcSelector = `.react-flow__handle[data-nodeid="${leftId}"][data-handlepos="right"]`;
    const tgtSelector = `.react-flow__handle[data-nodeid="${rightId}"][data-handlepos="left"]`;

    const srcHandle = page.locator(srcSelector);
    const tgtHandle = page.locator(tgtSelector);

    const srcCount = await srcHandle.count();
    const tgtCount = await tgtHandle.count();
    console.log(`Source (${leftId.substring(0,6)} right): ${srcCount}`);
    console.log(`Target (${rightId.substring(0,6)} left): ${tgtCount}`);

    if (srcCount > 0 && tgtCount > 0) {
      const srcBox = await srcHandle.boundingBox();
      const tgtBox = await tgtHandle.boundingBox();
      console.log(`Source pos: (${Math.round(srcBox.x + srcBox.width/2)}, ${Math.round(srcBox.y + srcBox.height/2)})`);
      console.log(`Target pos: (${Math.round(tgtBox.x + tgtBox.width/2)}, ${Math.round(tgtBox.y + tgtBox.height/2)})`);

      // Use dragTo
      console.log('Connecting...');
      try {
        await srcHandle.dragTo(tgtHandle, { timeout: 5000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log(`dragTo error: ${e.message.substring(0, 120)}`);
      }

      const edges = (await page.$$('.react-flow__edge')).length;
      console.log(`Edges: ${edges}`);
      if (edges > 0) {
        console.log('✅ EDGE CREATED!');
      } else {
        console.log('❌ No edge — trying mouse coordinates directly...');
        
        // Manual mouse drag using exact handle coordinates
        const sx = srcBox.x + srcBox.width / 2;
        const sy = srcBox.y + srcBox.height / 2;
        const tx = tgtBox.x + tgtBox.width / 2;
        const ty = tgtBox.y + tgtBox.height / 2;
        
        console.log(`Mouse drag: (${Math.round(sx)},${Math.round(sy)}) → (${Math.round(tx)},${Math.round(ty)})`);
        
        // Move to source, mouse down, then slowly move to target
        await page.mouse.move(sx, sy);
        await page.waitForTimeout(500);
        await page.mouse.down();
        await page.waitForTimeout(800);
        
        for (let i = 1; i <= 40; i++) {
          await page.mouse.move(sx + (tx - sx) * (i / 40), sy + (ty - sy) * (i / 40));
          await page.waitForTimeout(25);
        }
        
        await page.waitForTimeout(500);
        await page.mouse.up();
        await page.waitForTimeout(3000);

        const edges2 = (await page.$$('.react-flow__edge')).length;
        console.log(`Edges after manual: ${edges2}`);
        if (edges2 > 0) console.log('✅ EDGE CREATED!');
      }

      await page.screenshot({ path: 'test-screenshots/72-edge-result.png' });
    }
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-screenshots/73-final.png' });
  console.log('Done!');
  await browser.close();
})();
