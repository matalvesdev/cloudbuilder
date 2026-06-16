export type ConnectionEdgeType = 'default' | 'animated' | 'dashed' | 'network'

export interface EdgeStyleConfig {
  label: string
  color: string
  strokeWidth: number
  animated: boolean
  dashed: boolean
  labelPtBr: string
}

export const EDGE_TYPE_STYLES: Record<ConnectionEdgeType, EdgeStyleConfig> = {
  default: {
    label: 'Default',
    color: '#0a1128',
    strokeWidth: 2,
    animated: false,
    dashed: false,
    labelPtBr: 'Padrão',
  },
  animated: {
    label: 'Animated',
    color: '#ccff00',
    strokeWidth: 2.5,
    animated: true,
    dashed: true,
    labelPtBr: 'Animada',
  },
  dashed: {
    label: 'Dashed',
    color: '#a855f7',
    strokeWidth: 1.5,
    animated: false,
    dashed: true,
    labelPtBr: 'Tracejada',
  },
  network: {
    label: 'Network',
    color: '#3b82f6',
    strokeWidth: 2,
    animated: false,
    dashed: false,
    labelPtBr: 'Rede',
  },
}

export const EDGE_TYPE_OPTIONS = Object.entries(EDGE_TYPE_STYLES).map(([value, config]) => ({
  value: value as ConnectionEdgeType,
  label: config.label,
  color: config.color,
  labelPtBr: config.labelPtBr,
}))
