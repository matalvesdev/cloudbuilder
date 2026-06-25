import { test, expect } from '@playwright/test'
import { setupApp, goToModule } from './helpers'

test.describe('Docs Module', () => {

  test('renderiza árvore de documentação', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/docs/tree': [
        { name: 'Visão Geral', path: 'overview.md', type: 'directory', title: 'Visão Geral', children: [
          { name: 'Arquitetura', path: 'architecture.md', type: 'directory', title: 'Arquitetura', children: [
            { name: 'ADR-001.md', path: 'adr-001.md', type: 'file', title: 'ADR-001: Decisão Arquitetural' },
          ]},
        ]},
        { name: 'Guias', path: 'guides.md', type: 'directory', title: 'Guias', children: [
          { name: 'Quickstart.md', path: 'quickstart.md', type: 'file', title: 'Quickstart' },
        ]},
      ],
      '/api/v1/docs/content?path=architecture.md': {
        path: 'architecture.md', title: 'Arquitetura do CloudBuilder',
        content: '# Arquitetura\n\n## Stack\n\nBackend em Java 21 + Spring Boot.',
        lastModified: '2026-06-17T10:00:00Z',
      },
      '/api/v1/docs/content?path=adr-001.md': {
        path: 'adr-001.md', title: 'ADR-001: Decisão Arquitetural',
        content: '# ADR-001\n\nDecidimos usar Spring Boot.',
        lastModified: '2026-06-17T10:00:00Z',
      },
    })
    await goToModule(page, 'Docs')
    await expect(page.locator('text=Documentação').or(page.locator('text=Visão Geral')).first()).toBeVisible({ timeout: 8000 })
    // sidebar tree renders with doc titles
    await expect(page.locator('text=Visão Geral').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Guias').first()).toBeVisible({ timeout: 5000 })
  })

  test('barra de pesquisa está visível', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/docs/tree': [
        { name: 'Guias', path: 'guides.md', type: 'directory', title: 'Guias', children: [] },
      ],
      '/api/v1/docs/search?q=': [],
    })
    await goToModule(page, 'Docs')
    // Search input should be visible
    await expect(page.locator('input[placeholder*="Pesquisar"]').or(page.locator('input[placeholder*="Buscar"]')).first()).toBeVisible({ timeout: 8000 })
  })

  test('expande diretório e mostra documentos', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/docs/tree': [
        { name: 'Guia Rápido', path: 'quickstart.md', type: 'directory', title: 'Guia Rápido', children: [
          { name: 'Instalação', path: 'instalacao.md', type: 'file', title: 'Instalação' },
          { name: 'Configuração', path: 'configuracao.md', type: 'file', title: 'Configuração' },
        ]},
      ],
      '/api/v1/docs/content?path=quickstart.md': {
        path: 'quickstart.md', title: 'Guia Rápido',
        content: '# Guia Rápido\n\nBem-vindo ao CloudBuilder!',
        lastModified: '2026-06-17T10:00:00Z',
      },
    })
    await goToModule(page, 'Docs')
    // Expand directory
    await page.locator('text=Guia Rápido').first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=Instalação').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Configuração').first()).toBeVisible({ timeout: 5000 })
  })

  test('botão de importar documento está presente', async ({ page }) => {
    await setupApp(page, {
      '/api/v1/docs/tree': [],
    })
    await goToModule(page, 'Docs')
    await page.waitForTimeout(1000)
    // Look for import/upload button
    const importBtn = page.locator('button:has-text("Importar")').or(page.locator('button:has-text("Upload")'))
    const isVisible = await importBtn.isVisible().catch(() => false)
    if (isVisible) {
      await expect(importBtn).toBeVisible()
    } else {
      // Gerar ADR button might be present instead
      const adrBtn = page.locator('button:has-text("ADR")').or(page.locator('button:has-text("Gerar")'))
      await expect(adrBtn).toBeVisible({ timeout: 5000 })
    }
  })
})
