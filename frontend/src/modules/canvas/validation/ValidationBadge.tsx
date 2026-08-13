import { Check, X, AlertTriangle, Minus } from "lucide-react";

interface ValidationBadgeProps {
  status: "VALID" | "INVALID" | "PENDING" | "WARNING";
}

const config: Record<
  ValidationBadgeProps["status"],
  { icon: typeof Check; className: string }
> = {
  VALID: {
    icon: Check,
    className: "bg-green-500 text-white ring-2 ring-green-500/20",
  },
  INVALID: {
    icon: X,
    className: "bg-red-500 text-white ring-2 ring-red-500/20",
  },
  WARNING: {
    icon: AlertTriangle,
    className: "bg-yellow-500 text-white ring-2 ring-yellow-500/20",
  },
  PENDING: {
    icon: Minus,
    className: "bg-slate-400 text-white ring-2 ring-slate-400/20",
  },
};

export function ValidationBadge({ status }: ValidationBadgeProps) {
  const { icon: Icon, className } = config[status];
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${className}`}
    >
      <Icon className="w-2.5 h-2.5" strokeWidth={3} />
    </span>
  );
}
