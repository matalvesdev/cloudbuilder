const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

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

  // Create 2 nodes + connect
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
  console.log('Edge created');

  // Click on the edge line (interaction area)
  const edge = await page.$('.react-flow__edge');
  if (edge) {
    const box = await edge.boundingBox();
    if (box) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      console.log(`Clicking edge at (${Math.round(cx)}, ${Math.round(cy)})`);
      await page.mouse.click(cx, cy);
      await page.waitForTimeout(1500);
    }
  }

  // Verify EdgeToolbar is visible
  const toolbarInfo = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const typeButtons = buttons.filter(b => ['Padrão', 'Animada', 'Tracejada', 'Rede'].includes(b.getAttribute('title') || ''));
    const delButton = buttons.find(b => b.getAttribute('title') === 'Excluir');
    return {
      typeCount: typeButtons.length,
      typeLabels: typeButtons.map(b => b.getAttribute('title')),
      hasDelete: !!delButton,
      hasDeleteIcon: delButton ? delButton.textContent?.trim() : null,
    };
  });

  console.log(`EdgeToolbar visible: ${toolbarInfo.typeCount >= 4 ? '✅' : '❌'}`);
  console.log(`Types: ${toolbarInfo.typeLabels.join(', ')}`);
  console.log(`Delete button: ${toolbarInfo.hasDelete ? '✅' : '❌'} (${toolbarInfo.hasDeleteIcon})`);

  await page.screenshot({ path: 'test-screenshots/180-edge-toolbar.png' });
  console.log('Screenshot: 180-edge-toolbar.png');

  await browser.close();
})();
