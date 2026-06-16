import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);

// Login first - fill email and password
await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', 'admin@cloudbuilder.com');
await page.fill('input[type="password"], input[placeholder*="senha" i], input[name="password"]', 'admin123');

// Click "Entrar" button
await page.click('button:has-text("Entrar")');
await page.waitForTimeout(3000);

// Now navigate to design
await page.goto('http://localhost:3001/design', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

await page.screenshot({ path: 'debug_design3.png', fullPage: true });
console.log('Screenshot saved');

const info = await page.evaluate(() => {
  const reactFlow = document.querySelector('.react-flow');
  
  // Find palette sidebar
  let paletteEl = null;
  const allDivs = document.querySelectorAll('div');
  for (const d of allDivs) {
    const cs = getComputedStyle(d);
    if (d.className.includes('border-r') && d.className.includes('border-slate')) {
      paletteEl = {
        w: d.getBoundingClientRect().width,
        h: d.getBoundingClientRect().height,
        left: d.getBoundingClientRect().left,
        top: d.getBoundingClientRect().top,
        overflow: cs.overflow,
      };
      break;
    }
  }

  // DOM chain from react-flow up
  const chain = [];
  if (reactFlow) {
    let el = reactFlow;
    let depth = 0;
    while (el && depth < 15) {
      const rect = el.getBoundingClientRect();
      chain.push({
        depth,
        tag: el.tagName,
        class: (el.className || '').substring(0, 100),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        overflow: getComputedStyle(el).overflow,
        position: getComputedStyle(el).position,
      });
      el = el.parentElement;
      depth++;
    }
  }

  return {
    url: window.location.href,
    reactFlowExists: !!reactFlow,
    palette: paletteEl,
    chain,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
