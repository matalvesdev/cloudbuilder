import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

interface ChartConfig {
  label: string
  color: string
}

interface ChartContainerProps {
  config: Record<string, ChartConfig>
  children: React.ReactElement
  className?: string
}

export function ChartContainer({ config, children, className }: ChartContainerProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-medium text-slate-900">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface ChartLegendProps {
  payload?: Array<{ value: string; color: string }>
}

export function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap gap-4 pt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs text-slate-500">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export const BRAND_LIME = '#ccff00'
export const BRAND_NAVY = '#0a1128'
export const BRAND_ICE_BLUE = '#E3E2FD'
export const CHART_COLORS = [BRAND_LIME, '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa']
