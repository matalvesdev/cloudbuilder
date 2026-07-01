import type { LucideIcon } from 'lucide-react'

export interface CardProps {
  title: string
  value: string
  icon: LucideIcon
}

export function Card({ title, value, icon: Icon }: CardProps) {
  return (
    <div className="bg-white rounded-3xl p-5 card-shadow border border-slate-100 flex items-center gap-4">
      <div className="rounded-xl bg-ice-blue p-3">
        <Icon className="h-5 w-5 text-brand-navy" />
      </div>
      <div>
        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</p>
        <p className="text-2xl font-bold text-brand-navy">{value}</p>
      </div>
    </div>
  )
}
