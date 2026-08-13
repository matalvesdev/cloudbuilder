import type { LucideIcon } from "lucide-react";

export interface CardProps {
  title?: string;
  value?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  key?: string;
  onClick?: () => void;
}

export function Card({ title, value, icon: Icon, children, className, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl p-5 card-shadow border border-slate-100 ${className || ""}`}
      {...props}
    >
      {children ? children : (
        Icon ? (
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-ice-blue p-3">
              <Icon className="h-5 w-5 text-brand-navy" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</p>
              <p className="text-2xl font-bold text-brand-navy">{value}</p>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex items-center gap-2 mb-4 ${className || ""}`}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-brand-navy ${className || ""}`}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className || ""}>{children}</div>;
}
