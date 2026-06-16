/**
 * ID Mapper — bridges frontend nanoid (string) with backend UUID (string)
 *
 * The frontend generates nanoid IDs for local use, but the backend
 * generates UUIDs on create. This mapper tracks the mapping.
 */

const STORAGE_KEY = 'cloudbuilder-id-map'

interface IdMap {
  [localId: string]: string // localId -> backendId
}

function getMap(): IdMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveMap(map: IdMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function registerId(localId: string, backendId: string): void {
  const map = getMap()
  map[localId] = backendId
  saveMap(map)
}

export function getBackendId(localId: string): string {
  const map = getMap()
  return map[localId] || localId
}

export function getLocalId(backendId: string): string | undefined {
  const map = getMap()
  return Object.entries(map).find(([, v]) => v === backendId)?.[0]
}

export function clearIdMap(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function positionToBackend(pos: { x: number; y: number }): { positionX: number; positionY: number } {
  return { positionX: pos.x, positionY: pos.y }
}

export function positionToFrontend(positionX: number, positionY: number): { x: number; y: number } {
  return { x: positionX, y: positionY }
}

export function propertiesToBackend(props: Record<string, unknown>): string {
  return JSON.stringify(props)
}

export function propertiesToFrontend(props: string | null): Record<string, unknown> {
  if (!props) return {}
  try {
    return JSON.parse(props)
  } catch {
    return {}
  }
}
