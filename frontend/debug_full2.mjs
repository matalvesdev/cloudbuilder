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
  const panelGroup = document.querySelector('[data-panel-group]');
  const panels = document.querySelectorAll('[data-panel-id]');
  const separators = document.querySelectorAll('[data-resize-handle-active]');
  
  const result = {
    panelGroup: panelGroup ? {
      tag: panelGroup.tagName,
      width: panelGroup.getBoundingClientRect().width,
      height: panelGroup.getBoundingClientRect().height,
      left: panelGroup.getBoundingClientRect().left,
      style: panelGroup.getAttribute('style'),
      className: panelGroup.className,
      dataPanelGroupDirection: panelGroup.getAttribute('data-panel-group-direction'),
      dataPanelGroupId: panelGroup.getAttribute('data-panel-group-id'),
    } : 'NO PANEL GROUP FOUND',
    
    panels: Array.from(panels).map((p, i) => ({
      index: i,
      id: p.getAttribute('data-panel-id'),
      width: p.getBoundingClientRect().width,
      height: p.getBoundingClientRect().height,
      left: p.getBoundingClientRect().left,
      top: p.getBoundingClientRect().top,
      style: p.getAttribute('style'),
      className: p.className,
      dataPanelGroupId: p.getAttribute('data-panel-group-id'),
      dataPanelSize: p.getAttribute('data-panel-size'),
      dataPanelMinSize: p.getAttribute('data-panel-min-size'),
      dataPanelMaxSize: p.getAttribute('data-panel-max-size'),
      children: p.children.length,
      innerText: p.innerText?.substring(0, 100),
    })),
    
    separators: Array.from(separators).map((s, i) => ({
      index: i,
      width: s.getBoundingClientRect().width,
      left: s.getBoundingClientRect().left,
      className: s.className,
    })),
    
    // Also check if the palette is inside the first panel
    firstPanelChildren: panels[0] ? Array.from(panels[0].children).map(c => ({
      tag: c.tagName,
      class: c.className.substring(0, 100),
      width: c.getBoundingClientRect().width,
    })) : [],
  };
  
  return result;
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
