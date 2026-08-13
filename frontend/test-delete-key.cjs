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
  const loginBtn = await page.$('button:has-text("Entrar")');
  if (loginBtn) { await loginBtn.click(); await page.waitForTimeout(3000); }
  const skipBtn = await page.$('text=Pular onboarding');
  if (skipBtn) { await skipBtn.click(); await page.waitForTimeout(2000); }
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

  // Create 2 nodes + 1 edge
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

  let nodes = (await page.$$('.react-flow__node')).length;
  let edges = (await page.$$('.react-flow__edge')).length;
  console.log(`2. Before delete: ${nodes} nodes, ${edges} edges`);
  await page.screenshot({ path: 'test-screenshots/140-before.png' });

  // Select the right node (Subnet) and delete with Delete key
  console.log('3. Selecting Subnet...');
  const subnetNode = page.locator(`.react-flow__node[data-id="${nodeIds[1]}"]`);
  await subnetNode.click();
  await page.waitForTimeout(500);

  // Check if node got selected class
  const nodeClasses = await subnetNode.evaluate(el => el.className);
  console.log(`   Node classes: ${nodeClasses.substring(0, 80)}...`);

  console.log('4. Pressing Delete key...');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1500);

  let afterNodes = (await page.$$('.react-flow__node')).length;
  let afterEdges = (await page.$$('.react-flow__edge')).length;
  console.log(`5. After Delete: ${afterNodes} nodes, ${afterEdges} edges`);

  if (afterNodes === 2) {
    console.log('   Delete key failed — trying dispatchEvent on .react-flow...');
    await page.evaluate(() => {
      const rf = document.querySelector('.react-flow');
      if (rf) {
        rf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', bubbles: true }));
      }
    });
    await page.waitForTimeout(1500);
    afterNodes = (await page.$$('.react-flow__node')).length;
    afterEdges = (await page.$$('.react-flow__edge')).length;
    console.log(`   After dispatchEvent: ${afterNodes} nodes, ${afterEdges} edges`);
  }

  console.log('4. Pressing Delete key...');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(2000);

  nodes = (await page.$$('.react-flow__node')).length;
  edges = (await page.$$('.react-flow__edge')).length;
  console.log(`5. After delete: ${nodes} nodes, ${edges} edges`);

  const nodeDeleted = nodes === 1;
  const edgeRemoved = edges === 0;
  console.log(`   Node removed: ${nodeDeleted ? '✅' : '❌'}`);
  console.log(`   Edge removed: ${edgeRemoved ? '✅' : '❌'}`);
  console.log(`   Stats correct: ${nodeDeleted && edgeRemoved ? '✅' : '❌'}`);

  await page.screenshot({ path: 'test-screenshots/141-after.png' });
  console.log('   141-after.png');

  await browser.close();
})();
