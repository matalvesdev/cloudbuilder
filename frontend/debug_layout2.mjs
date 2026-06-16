import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Go to app and navigate to design page
await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(2000);

// Take screenshot of home page
await page.screenshot({ path: 'debug_home.png', fullPage: true });
console.log('Home page screenshot saved');

// Look for navigation links/buttons to the design module
const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
console.log('Page text:', bodyText);

// Get all links and buttons
const links = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('a, button, [role="button"], [role="tab"], [role="menuitem"]')).map(el => ({
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 50),
    href: el.href || '',
    classes: el.className.substring(0, 60),
    role: el.getAttribute('role') || '',
  }));
});
console.log('Links/buttons:', JSON.stringify(links, null, 2));

// Try clicking design-related elements
const designBtn = await page.locator('text=Design').first();
if (designBtn) {
  console.log('Design button found, clicking...');
  await designBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug_design.png', fullPage: true });
  console.log('Design page screenshot saved');
  
  // Now inspect the layout
  const info = await page.evaluate(() => {
    const reactFlow = document.querySelector('.react-flow');
    const palette = document.querySelector('[class*="border-r"]');
    
    // Find react-resizable-panels elements
    const panelEls = document.querySelectorAll('[style*="flex"]');
    const elements = Array.from(panelEls).slice(0, 20).map(el => ({
      tag: el.tagName,
      classes: el.className.substring(0, 100),
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      left: el.getBoundingClientRect().left,
      top: el.getBoundingClientRect().top,
      overflow: getComputedStyle(el).overflow,
      position: getComputedStyle(el).position,
    }));
    
    // Look for palette specifically
    const allDivs = document.querySelectorAll('div');
    let paletteDiv = null;
    for (const d of allDivs) {
      if (d.className.includes('border-r') && d.className.includes('border-slate-200')) {
        paletteDiv = {
          width: d.getBoundingClientRect().width,
          height: d.getBoundingClientRect().height,
          left: d.getBoundingClientRect().left,
          top: d.getBoundingClientRect().top,
          classes: d.className,
          overflow: getComputedStyle(d).overflow,
        };
        break;
      }
    }
    
    // Trace ReactFlow's DOM chain up
    let ref = reactFlow;
    const chain = [];
    let i = 0;
    while (ref && i < 8) {
      const rect = ref.getBoundingClientRect();
      chain.push({
        tag: ref.tagName,
        classes: ref.className?.substring(0, 80) || '',
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        overflow: getComputedStyle(ref).overflow,
        position: getComputedStyle(ref).position,
        display: getComputedStyle(ref).display,
      });
      ref = ref.parentElement;
      i++;
    }
    
    return {
      reactFlowExists: !!reactFlow,
      paletteDiv,
      elements,
      domChain: chain,
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
}

await browser.close();
