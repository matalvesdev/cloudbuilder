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
  await addNode('VPC', 'aws', 'aws_vpc', 200, 300);
  await addNode('Subnet', 'aws', 'aws_subnet', 1200, 300);
  let nodes = (await page.$$('.react-flow__node')).length;
  console.log(`2. Nodes: ${nodes}`);

  // Delete Subnet
  const nodeIds = await page.$$eval('.react-flow__node', els =>
    els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)
       .map(el => el.getAttribute('data-id'))
  );
  await page.locator(`.react-flow__node[data-id="${nodeIds[1]}"]`).click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  nodes = (await page.$$('.react-flow__node')).length;
  console.log(`3. After delete — Nodes: ${nodes}`);
  await page.screenshot({ path: 'test-screenshots/110-after-delete.png' });

  // Find and click UNDO button (it's the Undo2 icon button in the toolbar)
  console.log('4. Clicking Undo button...');
  // The undo button has Undo2 icon inside a Tooltip. Find it by the SVG icon.
  const undoBtn = await page.locator('button:has(svg.lucide-undo2)').first();
  const undoExists = await undoBtn.count();
  console.log(`   Undo button found: ${undoExists > 0}`);
  
  if (undoExists > 0) {
    const isDisabled = await undoBtn.evaluate(el => el.disabled);
    console.log(`   Disabled: ${isDisabled}`);
    if (!isDisabled) {
      await undoBtn.click();
      await page.waitForTimeout(2000);
      nodes = (await page.$$('.react-flow__node')).length;
      console.log(`   After undo — Nodes: ${nodes}`);
      await page.screenshot({ path: 'test-screenshots/111-after-undo.png' });

      if (nodes === 2) {
        console.log('   ✅ UNDO WORKS!');
      } else {
        console.log('   ❌ Undo did not restore node');
      }
    } else {
      console.log('   Undo button is disabled — checking if store has undo stack...');
      const undoAvailable = await page.evaluate(() => {
        // Try to check React component tree for undo state
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const svgs = btn.querySelectorAll('svg');
          for (const svg of svgs) {
            if (svg.classList.contains('lucide-undo2')) {
              return { found: true, disabled: btn.disabled };
            }
          }
        }
        return { found: false };
      });
      console.log(`   Button state: ${JSON.stringify(undoAvailable)}`);
    }
  }

  // Try REDO
  if (nodes === 2) {
    console.log('5. Clicking Redo button...');
    const redoBtn = await page.locator('button:has(svg.lucide-redo2)').first();
    if (await redoBtn.count() > 0) {
      const redoDisabled = await redoBtn.evaluate(el => el.disabled);
      if (!redoDisabled) {
        await redoBtn.click();
        await page.waitForTimeout(2000);
        nodes = (await page.$$('.react-flow__node')).length;
        console.log(`   After redo — Nodes: ${nodes}`);
        if (nodes === 1) console.log('   ✅ REDO WORKS!');
      }
    }
  }

  await page.screenshot({ path: 'test-screenshots/112-final.png' });
  console.log('\nDone!');
  await browser.close();
})();
