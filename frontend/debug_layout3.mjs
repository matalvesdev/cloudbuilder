import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);

// Click "Design Visual" link/button - try all locators
const link = page.locator('a:has-text("Design Visual")');
const exists = await link.count();
console.log(`Found ${exists} Design Visual links`);

if (exists > 0) {
  await link.first().click();
} else {
  // Try navigating directly
  await page.goto('http://localhost:3001/design', { waitUntil: 'networkidle', timeout: 15000 });
}
await page.waitForTimeout(3000);

await page.screenshot({ path: 'debug_design2.png', fullPage: true });
console.log('Design page screenshot saved');

const info = await page.evaluate(() => {
  const reactFlow = document.querySelector('.react-flow');
  
  // Find all panels and their structure
  const allDivs = document.querySelectorAll('div');
  let paletteDiv = null;
  let structure = [];
  
  // Find the palette
  for (const d of allDivs) {
    if (d.className.includes('border-r') && d.className.includes('border-slate')) {
      paletteDiv = {
        w: d.getBoundingClientRect().width,
        h: d.getBoundingClientRect().height,
        left: d.getBoundingClientRect().left,
        top: d.getBoundingClientRect().top,
      };
      break;
    }
  }
  
  // Walk from react-flow up to find the layout issue
  if (reactFlow) {
    let el = reactFlow;
    let depth = 0;
    while (el && depth < 15) {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      structure.push({
        depth,
        tag: el.tagName,
        id: el.id || '',
        class: (el.className || '').substring(0, 90),
        w: rect.width,
        h: rect.height,
        left: rect.left,
        top: rect.top,
        overflow: cs.overflow,
        position: cs.position,
        display: cs.display,
        flex: cs.flex,
      });
      el = el.parentElement;
      depth++;
    }
  }

  // Also check for any absolutely positioned overlays
  const absElements = [];
  for (const d of allDivs) {
    const cs = getComputedStyle(d);
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      const rect = d.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        absElements.push({
          class: d.className.substring(0, 60),
          w: rect.width,
          h: rect.height,
          left: rect.left,
          top: rect.top,
          position: cs.position,
          zIndex: cs.zIndex,
        });
      }
    }
  }

  return {
    url: window.location.href,
    reactFlowExists: !!reactFlow,
    palette: paletteDiv,
    structure,
    absoluteElements: absElements,
    title: document.title,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
