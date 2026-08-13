import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PropertyField } from "./PropertySchema";

interface DynamicPropertyFormProps {
  schema: PropertyField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

export function DynamicPropertyForm({
  schema,
  values,
  onChange,
  errors,
}: DynamicPropertyFormProps) {
  return (
    <div className="space-y-3">
      {schema.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={values?.[field.key] ?? field.defaultValue ?? null}
          onChange={onChange}
          error={errors?.[field.key]}
        />
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: PropertyField;
  value: any;
  onChange: (key: string, value: any) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  switch (field.type) {
    case "text":
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "number":
      return (
        <NumberField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "select":
      return (
        <SelectField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "boolean":
      return (
        <BooleanField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "tags":
      return (
        <TagsField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "cidr":
      return (
        <CidrField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    default:
      return null;
  }
}

function LabelWrapper({
  field,
  error,
  children,
}: {
  field: PropertyField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-red-500 font-bold">*</span>}
      </Label>
      {children}
      {field.description && !error && (
        <p className="text-[10px] text-slate-400 leading-tight">
          {field.description}
        </p>
      )}
      {error && (
        <p className="text-[10px] text-red-500 leading-tight">{error}</p>
      )}
    </div>
  );
}

function TextField({ field, value, onChange, error }: FieldRendererProps) {
  const isPassword = field.key.toLowerCase().includes("password");
  return (
    <LabelWrapper field={field} error={error}>
      <Input
        type={isPassword ? "password" : "text"}
        value={value ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(
          "mt-1 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary",
          error && "border-red-500",
        )}
        placeholder={field.placeholder}
      />
    </LabelWrapper>
  );
}

function NumberField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <LabelWrapper field={field} error={error}>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            field.key,
            e.target.value === "" ? null : Number(e.target.value),
          )
        }
        className={cn(
          "mt-1 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary",
          error && "border-red-500",
        )}
        placeholder={field.placeholder}
        min={field.validation?.min}
        max={field.validation?.max}
      />
    </LabelWrapper>
  );
}

function SelectField({ field, value, onChange, error }: FieldRendererProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = field.options?.find((o) => o.value === value);
  const displayValue = selected?.label ?? field.placeholder ?? "Selecionar...";

  return (
    <LabelWrapper field={field} error={error}>
      <div ref={ref} className="relative mt-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs transition-colors",
            "hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
            error && "border-red-500",
          )}
        >
          <span
            className={cn(
              value ? "font-mono text-slate-700" : "text-slate-400",
            )}
          >
            {displayValue}
          </span>
          <svg
            className="h-3.5 w-3.5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {open && field.options && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-100 bg-white py-1 shadow-lg card-shadow">
            {field.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(field.key, option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-xs font-mono text-left hover:bg-slate-50 transition-colors",
                  option.value === value &&
                    "bg-ice-blue text-brand-navy font-semibold",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </LabelWrapper>
  );
}

function BooleanField({ field, value, onChange, error }: FieldRendererProps) {
  const boolValue = value === true || value === "true";
  return (
    <LabelWrapper field={field} error={error}>
      <button
        type="button"
        onClick={() => onChange(field.key, !boolValue)}
        className={cn(
          "mt-1 flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-xs transition-colors",
          boolValue
            ? "border-green-100 bg-green-50 text-green-700"
            : "border-slate-200 bg-slate-50 text-slate-500",
          error && "border-red-500",
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded border flex items-center justify-center transition-colors",
            boolValue
              ? "bg-green-500 border-green-500 text-white"
              : "border-slate-300 bg-white",
          )}
        >
          {boolValue && (
            <svg
              className="h-2.5 w-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <span>{boolValue ? "Verdadeiro" : "Falso"}</span>
      </button>
    </LabelWrapper>
  );
}

function TagsField({ field, value, onChange, error }: FieldRendererProps) {
  const tags: string[] = Array.isArray(value) ? value : [];
  const text = tags.join("\n");

  return (
    <LabelWrapper field={field} error={error}>
      <textarea
        value={text}
        onChange={(e) => {
          const lines = e.target.value
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          onChange(field.key, lines);
        }}
        className={cn(
          "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono transition-colors",
          "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          "resize-vertical min-h-[64px]",
          error && "border-red-500",
        )}
        placeholder={field.placeholder ?? "Um item por linha"}
        rows={3}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 rounded bg-ice-blue text-brand-navy border-0"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </LabelWrapper>
  );
}

function CidrField({ field, value, onChange, error }: FieldRendererProps) {
  return (
    <LabelWrapper field={field} error={error}>
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(
          "mt-1 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary",
          error && "border-red-500",
        )}
        placeholder={field.placeholder ?? "0.0.0.0/0"}
        pattern={field.validation?.pattern}
      />
    </LabelWrapper>
  );
}
