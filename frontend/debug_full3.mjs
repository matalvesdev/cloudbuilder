import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);
await page.fill('input[type="email"], input[placeholder*="email" i], input[name="email"]', 'admin@cloudbuilder.com');
await page.fill('input[type="password"], input[placeholder*="senha" i], input[name="password"]', 'admin123');
await page.click('button:has-text("Entrar")');
await page.waitForTimeout(2000);
await page.goto('http://localhost:3001/design', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  // Find ALL divs with style containing "flex" (likely panel-group children)
  const allDivs = document.querySelectorAll('div');
  const flexDivs = [];
  
  for (const d of allDivs) {
    const style = d.getAttribute('style') || '';
    if (style.includes('flex') || style.includes('overflow')) {
      flexDivs.push({
        tag: d.tagName,
        style: style,
        class: d.className.substring(0, 80),
        w: d.getBoundingClientRect().width,
        h: d.getBoundingClientRect().height,
        left: d.getBoundingClientRect().left,
        top: d.getBoundingClientRect().top,
        id: d.id,
      });
    }
    if (flexDivs.length >= 30) break;
  }
  
  // Find the palette sidebar specifically using its known characteristics
  const paletteSidebar = [];
  for (const d of allDivs) {
    const rect = d.getBoundingClientRect();
    if (rect.left === 0 && rect.top === 56 && rect.width < 300 && rect.width > 20) {
      paletteSidebar.push({
        class: d.className.substring(0, 150),
        style: d.getAttribute('style') || '',
        w: rect.width,
        h: rect.height,
        children: d.children.length,
        innerHTML: d.innerHTML.substring(0, 200),
      });
    }
  }
  
  // Find the exact panel-group wrapper
  const candidates = [];
  for (const d of allDivs) {
    if (d.children.length >= 2) {
      const firstChild = d.children[0];
      const lastChild = d.children[d.children.length - 1];
      const firstRect = firstChild.getBoundingClientRect();
      const lastRect = lastChild.getBoundingClientRect();
      // If children are side by side (different left positions)
      if (firstRect.left < lastRect.left && d.getBoundingClientRect().width > 500) {
        const dRect = d.getBoundingClientRect();
        candidates.push({
          class: d.className.substring(0, 100),
          style: d.getAttribute('style') || '',
          w: dRect.width,
          h: dRect.height,
          left: dRect.left,
          top: dRect.top,
          children: d.children.length,
          childWidths: Array.from(d.children).map(c => c.getBoundingClientRect().width),
          childLefts: Array.from(d.children).map(c => c.getBoundingClientRect().left),
        });
      }
    }
    if (candidates.length > 5) break;
  }
  
  return { flexDivs, paletteSidebar, candidates };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
