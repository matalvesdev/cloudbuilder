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
  // Deep DOM tree from ReactFlowProvider down to each panel
  const mainContent = document.querySelector('[class*="flex-1"][class*="overflow-hidden"]');
  
  // Get all children of the panel group
  const group = document.querySelector('[class*="flex h-full w-full"]');
  
  const result = {
    groupHTML: group ? group.innerHTML.substring(0, 2000) : 'no group',
    groupChildren: group ? Array.from(group.children).map(c => ({
      tag: c.tagName,
      class: c.className.substring(0, 80),
      w: c.getBoundingClientRect().width,
      left: c.getBoundingClientRect().left,
      attrs: Array.from(c.attributes).map(a => `${a.name}="${a.value}"`).join(' '),
    })) : [],
  };

  return result;
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
