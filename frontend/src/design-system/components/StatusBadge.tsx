import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  label?: string;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export function StatusBadge({ status, variant, label, size }: StatusBadgeProps) {
  const resolvedVariant = variant || "default";
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        sizeClass,
        variantStyles[resolvedVariant] || variantStyles.default
      )}
    >
      {label || status}
    </span>
  );
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | React.ReactElement;
  title: string;
  description?: string;
  action?: React.ReactNode | { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return <div className="mb-4">{icon}</div>;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="h-12 w-12 text-slate-300 mb-4" />;
  };

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) return action;
    const act = action as { label: string; onClick: () => void };
    return (
      <button
        onClick={act.onClick}
        className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:opacity-90"
      >
        {act.label}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {renderIcon()}
      <h3 className="text-lg font-medium text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
      {renderAction()}
    </div>
  );
}
