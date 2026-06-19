/**
 * ID Mapper — converts between frontend (XYPosition) and backend (flat) formats.
 *
 * Both sides now use String IDs natively (UUID v4 format via crypto.randomUUID()).
 * No ID mapping is needed — IDs pass through directly.
 */

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
