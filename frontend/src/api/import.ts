import { api } from './client'
import type {
  ImportTerraformRequest,
  ImportTerraformResponse,
  ImportStateRequest,
  ImportStateResponse,
  ImportMultiRequest,
  ImportMultiResponse,
} from './types'

export function importTerraform(content: string): Promise<ImportTerraformResponse> {
  return api.post<ImportTerraformResponse>('/import/terraform', { content } as ImportTerraformRequest)
}

export function importState(content: string): Promise<ImportStateResponse> {
  return api.post<ImportStateResponse>('/import/state', { content } as ImportStateRequest)
}

export function importMulti(files: { fileName: string; content: string }[]): Promise<ImportMultiResponse> {
  return api.post<ImportMultiResponse>('/import/multi', { files } as ImportMultiRequest)
}

export async function importUpload(files: FileList | File[]): Promise<ImportMultiResponse> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files', file)
  }

  const token = localStorage.getItem('cloudbuilder-auth-token')
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/import/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao fazer upload' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}
