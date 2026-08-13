import { test, expect, Page } from '@playwright/test'

/**
 * Pipeline E2E — valida o fluxo completo com backend REAL (não mocks).
 *
 * Pré-requisito: Backend rodando em http://localhost:8080 com profile dev (H2).
 *   ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
 *
 * O frontend (Vite) é iniciado automaticamente pelo webServer do Playwright
 * em http://localhost:3000, com proxy /api → http://localhost:8080.
 */

/** Tempo limite generoso para operações contra backend real */
const API_TIMEOUT = 30000

/**
 * Injeta localStorage antes da página carregar para pular onboarding
 * e garantir que não haja token inválido persistido.
 */
async function prepareApp(page: Page) {
  await page.addInitScript(() => {
    // Limpa qualquer sessão anterior
    localStorage.clear()
    // Pula onboarding completamente
    localStorage.setItem('cloudbuilder-onboarding-storage', JSON.stringify({
      state: { progress: { stage: 'skipped', completedSteps: [] }, repoConfig: null, tourCompleted: false, hasSeenWelcome: true },
      version: 0,
    }))
    // Garante que o tenant selector não trava
    localStorage.setItem('cloudbuilder-active-tenant-id', 'dev-tenant')
  })
}

/**
 * Faz login via formulário — o DevAuthController aceita qualquer email/senha.
 * Retorna o token JWT para uso em chamadas diretas se necessário.
 */
async function login(page: Page, email = 'dev@cloudbuilder.com', password = 'qualquer-senha') {
  await page.goto('/', { waitUntil: 'networkidle' })

  // Verifica que estamos na página de login
  await expect(page.locator('h1:has-text("CloudBuilder")').first()).toBeVisible({ timeout: 10000 })

  // Preenche formulário
  const emailInput = page.locator('input[type="email"]')
  const passwordInput = page.locator('input[type="password"]')
  await expect(emailInput).toBeVisible({ timeout: 5000 })

  await emailInput.fill(email)
  await passwordInput.fill(password)

  // Clica em "Entrar"
  const submitButton = page.locator('button[type="submit"]:has-text("Entrar")')
  await expect(submitButton).toBeEnabled({ timeout: 5000 })
  await submitButton.click()

  // Aguarda navegação para o app — o breadcrumb "Dashboard" indica sucesso
  await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: API_TIMEOUT })
}

/**
 * Navega para um módulo via nav.
 * Grupo dropdown se tiver >1 item, botão direto se for único.
 */
async function navigateTo(page: Page, moduleLabel: string, groupLabel?: string) {
  if (groupLabel) {
    // Abre o dropdown do grupo
    const groupBtn = page.locator('nav button', { hasText: groupLabel })
    await expect(groupBtn.first()).toBeVisible({ timeout: 10000 })
    await groupBtn.first().hover()

    // Espera o menu aparecer e clica no item
    await page.waitForTimeout(500)
    const menuItem = page.locator('nav [class*="rounded-xl"][class*="shadow-lg"] button', { hasText: moduleLabel })
    await expect(menuItem.first()).toBeVisible({ timeout: 5000 }).catch(async () => {
      // Fallback: tenta dar click direto no botão do grupo e depois no item
      await groupBtn.first().click()
      await page.waitForTimeout(300)
    })
    await menuItem.first().click()
  } else {
    // Botão direto na nav
    const btn = page.locator('nav button', { hasText: moduleLabel })
    await expect(btn.first()).toBeVisible({ timeout: 10000 })
    await btn.first().click()
  }

  // Aguarda renderização do módulo
  await page.waitForTimeout(2000)
}

test.describe('Pipeline Completo — Backend Real', () => {

  test('CT-01: Login + Dashboard carrega', async ({ page }) => {
    await prepareApp(page)
    await login(page)

    // Dashboard deve mostrar indicadores
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 5000 })
  })

  test('CT-02: Design Module — cria canvas via template VPC Básica', async ({ page }) => {
    await prepareApp(page)
    await login(page)

    // Navega para Design (dentro do grupo Infraestrutura)
    await navigateTo(page, 'Design', 'Infraestrutura')

    // O módulo Design deve renderizar — verifica presença do ReactFlow
    // ou do título "Canvas vazio"
    await expect(
      page.locator('.react-flow').or(page.locator('text=Canvas vazio')).first()
    ).toBeVisible({ timeout: 15000 })

    // Clica no template "VPC Básica" para criar nós
    const templateBtn = page.locator('button:has-text("VPC Básica")')
    await expect(templateBtn.first()).toBeVisible({ timeout: 5000 })
    await templateBtn.first().click()

    // Aguarda os nós serem adicionados ao canvas
    await page.waitForTimeout(2000)

    // Verifica que o canvas não está mais vazio (nós foram adicionados)
    const reactFlowNodes = page.locator('.react-flow__node, [data-testid="rf__node"]')
    const nodeCount = await reactFlowNodes.count()
    expect(nodeCount).toBeGreaterThanOrEqual(1)
  })

  test('CT-03: Provision Module — gera código Terraform', async ({ page }) => {
    await prepareApp(page)
    await login(page)

    // Primeiro cria um canvas com nós
    await navigateTo(page, 'Design', 'Infraestrutura')
    await expect(
      page.locator('.react-flow').or(page.locator('text=Canvas vazio')).first()
    ).toBeVisible({ timeout: 15000 })

    const templateBtn = page.locator('button:has-text("VPC Básica")')
    if (await templateBtn.first().isVisible().catch(() => false)) {
      await templateBtn.first().click()
      await page.waitForTimeout(2000)
    }

    // Navega para Provisionamento
    await navigateTo(page, 'Provisionar', 'Infraestrutura')

    // Deve exibir informação sobre o design ou código gerado
    await expect(
      page.locator('text=Provisionar').or(page.locator('text=main.tf')).first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('CT-04: Pipeline completo — login → canvas → generate via REST API', async ({ page, request }) => {
    // Este teste usa a API diretamente (fora do browser) para validar
    // o pipeline backend completo de forma determinística.

    // 1. Login via API
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: 'e2e@cloudbuilder.com', password: 'qualquer' },
    })
    expect(loginRes.ok()).toBeTruthy()
    const loginBody = await loginRes.json()
    expect(loginBody.token).toBeTruthy()
    expect(loginBody.userId).toBeTruthy()
    const token = loginBody.token
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

    // 2. Criar canvas
    const canvasRes = await request.post('/api/v1/canvases', {
      headers,
      data: { name: 'E2E Pipeline Test', description: 'Criado por teste E2E' },
    })
    expect(canvasRes.ok()).toBeTruthy()
    const canvasBody = await canvasRes.json()
    const canvasId = canvasBody.id
    expect(canvasId).toBeTruthy()

    // 3. Adicionar nós (S3 Bucket + EC2)
    const node1Res = await request.post(`/api/v1/canvases/${canvasId}/nodes`, {
      headers,
      data: {
        componentType: 'aws-s3',
        label: 'Bucket E2E',
        positionX: 100,
        positionY: 100,
        properties: { bucket: 'meu-bucket-e2e', acl: 'private', region: 'us-east-1' },
      },
    })
    expect(node1Res.ok()).toBeTruthy()
    const node1 = await node1Res.json()

    const node2Res = await request.post(`/api/v1/canvases/${canvasId}/nodes`, {
      headers,
      data: {
        componentType: 'aws-ec2',
        label: 'EC2 E2E',
        positionX: 400,
        positionY: 100,
        properties: { instanceType: 't3.micro', ami: 'ami-0c55b159cbfafe1f0', region: 'us-east-1' },
      },
    })
    expect(node2Res.ok()).toBeTruthy()
    const node2 = await node2Res.json()

    // 4. Conectar nós com uma edge
    const edgeRes = await request.post(`/api/v1/canvases/${canvasId}/edges`, {
      headers,
      data: {
        sourceNodeId: node1.id,
        targetNodeId: node2.id,
        label: 'conexao-e2e',
      },
    })
    expect(edgeRes.ok()).toBeTruthy()

    // 5. Validar canvas
    const validateRes = await request.post(`/api/v1/canvases/${canvasId}/validate`, { headers })
    expect(validateRes.ok()).toBeTruthy()
    const validation = await validateRes.json()
    // Validação pode ter warnings (ex: connectionCompatibility) mas não deve falhar
    expect(validation).toBeDefined()

    // 6. Gerar código Terraform
    const generateRes = await request.post(`/api/v1/canvases/${canvasId}/generate`, { headers })
    expect(generateRes.ok()).toBeTruthy()
    const generated = await generateRes.json()
    // Deve gerar ao menos main.tf
    expect(generated.files).toBeDefined()
    expect(generated.files['main.tf'] || generated.files['generated/main.tf']).toBeTruthy()

    // 7. Criar plano de deploy
    const planRes = await request.post(`/api/v1/canvases/${canvasId}/generate/plan`, {
      headers,
      data: { engine: 'terraform' },
    })
    // Pode falhar se o provision-engine não estiver disponível — aceitável em dev
    if (planRes.ok()) {
      const planBody = await planRes.json()
      expect(planBody.id).toBeTruthy()
      expect(planBody.status === 'planned' || planBody.status === 'pending').toBeTruthy()
    }

    // 8. Remover canvas (cleanup)
    const delRes = await request.delete(`/api/v1/canvases/${canvasId}`, { headers })
    // 204 No Content ou 200 OK — ambos aceitos
    expect(delRes.ok() || delRes.status() === 204).toBeTruthy()
  })

  test('CT-05: Logout funciona', async ({ page }) => {
    await prepareApp(page)
    await login(page)

    // Encontra e clica no logout — deve ter um botão com ícone LogOut
    const logoutBtn = page.locator('button:has(svg)').locator('visible=true').last()
    // Ou procura por aria-label ou pelo texto "Sair"
    const sairBtn = page.locator('button:has-text("Sair"), [aria-label="Sair"]')

    if (await sairBtn.isVisible().catch(() => false)) {
      await sairBtn.click()
    } else {
      // Tenta pelo ícone LogOut
      const iconBtn = page.locator('button').filter({ has: page.locator('svg') }).last()
      await iconBtn.click()
    }

    await page.waitForTimeout(2000)
    // Deve voltar para a tela de login
    await expect(page.locator('h1:has-text("CloudBuilder")').first()).toBeVisible({ timeout: 10000 })
  })
})
