/**
 * Native cn() — replaces clsx + tailwind-merge.
 * Joins class names, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Native cva() — replaces class-variance-authority.
 * Builds a class string from base + variant options.
 */
export interface CvaConfig {
  variants?: Record<string, Record<string, string>>;
  defaultVariants?: Record<string, string>;
}

export function cva(base: string, config?: CvaConfig) {
  return (props: Record<string, string | undefined> = {}): string => {
    if (!config) return base;
    const merged = { ...config.defaultVariants, ...props };
    const classes = [base];
    if (config.variants) {
      for (const [key, variants] of Object.entries(config.variants)) {
        const value = merged[key];
        if (value && variants[value]) {
          classes.push(variants[value]);
        }
      }
    }
    return classes.join(" ");
  };
}

/**
 * Simple VariantProps for components using cva.
 * Provides optional variant and size string props.
 */
export interface VariantProps {
  variant?: string;
  size?: string;
}

/**
 * Native nanoid replacement — generates cryptographically random IDs.
 * Without arguments returns a UUID v4 (same as crypto.randomUUID()).
 * With length returns a hex string of the specified length.
 */
export function nanoId(length?: number): string {
  if (length != null) {
    const arr = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, length);
  }
  return crypto.randomUUID();
}
