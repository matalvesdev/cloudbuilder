import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  // Look for the palette sidebar container
  const sidebars = document.querySelectorAll('[class*="border-r"]');
  const allDivs = document.querySelectorAll('div');
  const panels = document.querySelectorAll('[data-panel-id]');
  const reactFlow = document.querySelector('.react-flow');
  const reactFlowViewport = document.querySelector('.react-flow__viewport');
  
  // Find the main flex container
  const flexContainers = [];
  document.querySelectorAll('div').forEach(d => {
    const cs = getComputedStyle(d);
    if (cs.display === 'flex' && cs.flexDirection === 'row') {
      flexContainers.push({
        tag: d.tagName,
        classes: d.className,
        width: d.getBoundingClientRect().width,
        height: d.getBoundingClientRect().height,
        left: d.getBoundingClientRect().left,
        children: d.children.length,
        overflow: cs.overflow,
      });
    }
  });

  // Find all panel-group elements (react-resizable-panels)
  const panelGroups = document.querySelectorAll('[data-panel-group]');
  const panelGroupData = Array.from(panelGroups).map(pg => ({
    id: pg.id,
    width: pg.getBoundingClientRect().width,
    left: pg.getBoundingClientRect().left,
    direction: pg.getAttribute('data-panel-group-direction'),
    children: pg.children.length,
  }));

  // Find all panel elements
  const panelData = Array.from(panels).map(p => ({
    id: p.getAttribute('data-panel-id'),
    width: p.getBoundingClientRect().width,
    left: p.getBoundingClientRect().left,
    visible: p.offsetParent !== null,
    overflow: getComputedStyle(p).overflow,
    position: getComputedStyle(p).position,
  }));

  // Debug the react-flow and its parents up to body
  let el = reactFlow;
  const hierarchy = [];
  let depth = 0;
  while (el && depth < 10) {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    hierarchy.push({
      tag: el.tagName,
      classes: el.className.substring(0, 80),
      id: el.id,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      overflow: cs.overflow,
      position: cs.position,
      display: cs.display,
    });
    el = el.parentElement;
    depth++;
  }

  const reactFlowRect = reactFlow?.getBoundingClientRect();
  const viewportRect = reactFlowViewport?.getBoundingClientRect();

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    pageTitle: document.title,
    panelGroups: panelGroupData,
    panels: panelData,
    reactFlow: reactFlowRect ? {
      width: reactFlowRect.width,
      height: reactFlowRect.height,
      left: reactFlowRect.left,
      top: reactFlowRect.top,
      right: reactFlowRect.right,
    } : null,
    reactFlowViewport: viewportRect ? {
      width: viewportRect.width,
      height: viewportRect.height,
      left: viewportRect.left,
      top: viewportRect.top,
    } : null,
    hierarchy,
    sidebars: Array.from(sidebars).slice(0, 3).map(s => ({
      classes: s.className.substring(0, 100),
      width: s.getBoundingClientRect().width,
      left: s.getBoundingClientRect().left,
    })),
  };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'debug_layout.png', fullPage: true });
console.log('Screenshot saved to debug_layout.png');
await browser.close();
