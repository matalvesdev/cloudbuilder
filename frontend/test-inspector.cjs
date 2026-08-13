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

  // Add VPC node
  await page.evaluate(() => {
    const rd = document.querySelector('.react-flow__renderer');
    if (!rd) return;
    const dt = new DataTransfer();
    dt.setData('application/reactflow', JSON.stringify({
      id: `aws-aws_vpc-${Date.now()}`, label: 'Minha VPC', provider: 'aws',
      resourceType: 'aws_vpc', category: 'network', displayName: 'Minha VPC',
      description: 'Virtual Private Cloud', properties: {}, validationStatus: 'PENDING'
    }));
    dt.effectAllowed = 'copy';
    const rc = rd.getBoundingClientRect();
    rd.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, clientX: rc.left + 400, clientY: rc.top + 300, dataTransfer: dt }));
    rd.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, clientX: rc.left + 400, clientY: rc.top + 300, dataTransfer: dt }));
  });
  await page.waitForTimeout(1500);
  const fitBtn = await page.$('.react-flow__controls-fitview');
  if (fitBtn) { await fitBtn.click(); await page.waitForTimeout(1000); }
  console.log('2. VPC node created');

  // Select node
  const node = await page.$('.react-flow__node');
  if (node) {
    await node.click();
    await page.waitForTimeout(1000);
    console.log('3. Node selected — inspector visible');
    
    // 4. Edit CIDR Block
    const cidrInput = await page.$('input[placeholder="10.0.0.0/16"]');
    if (cidrInput) {
      console.log('4. Found CIDR input in inspector');
      
      // Clear and type new value
      await cidrInput.click({ clickCount: 3 });
      await page.waitForTimeout(200);
      await cidrInput.fill('172.16.0.0/16');
      await page.waitForTimeout(500);
      
      // Press Tab or click elsewhere to trigger onChange
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-screenshots/96-cidr-changed.png' });
      
      // Verify the value persisted
      const newVal = await cidrInput.inputValue();
      console.log(`   CIDR value in inspector: "${newVal}"`);
      console.log(`   CIDR updated: ${newVal === '172.16.0.0/16' ? '✅ YES' : '❌ NO'}`);
      
      // 5. Double-click node to inline edit the name
      console.log('5. Testing inline name edit...');
      await node.dblclick();
      await page.waitForTimeout(500);
      
      // Find the inline edit input
      const inlineInput = await page.$('.react-flow__node input[type="text"]');
      if (inlineInput) {
        console.log('   Found inline edit input');
        await inlineInput.click({ clickCount: 3 });
        await inlineInput.fill('VPC Produção');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        // Verify node label updated
        const nodeText = await node.textContent();
        const labelUpdated = nodeText?.includes('VPC Produção');
        console.log(`   Node label: "${nodeText?.substring(0, 50)}"`);
        console.log(`   Label updated: ${labelUpdated ? '✅ YES' : '❌ NO'}`);
        
        await page.screenshot({ path: 'test-screenshots/97-name-changed.png' });
      } else {
        console.log('   Inline input not found — trying via PropertiesPanel');
        // The PropertiesPanel has its own label input
        const propInput = await page.$('.PropertiesPanel input[type="text"]');
        if (propInput) {
          const currentVal = await propInput.inputValue();
          console.log(`   PropertiesPanel input value: "${currentVal}"`);
          await propInput.click({ clickCount: 3 });
          await propInput.fill('VPC Produção');
          await page.waitForTimeout(1000);
          const nodeText2 = await node.textContent();
          console.log(`   After edit: "${nodeText2?.substring(0, 50)}"`);
        }
      }
    } else {
      console.log('4. CIDR input not found');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/98-final.png' });
    console.log('   98-final.png');
  }

  console.log('\nDone!');
  await browser.close();
})();
