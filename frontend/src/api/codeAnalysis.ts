import type { CodeAnalysisRequest, CodeAnalysisResponse } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

export async function analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> {
  const response = await fetch(`${API_BASE}/code-analysis/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao analisar código: ${response.status} ${text}`)
  }
  return response.json()
}
