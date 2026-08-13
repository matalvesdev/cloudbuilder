import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { cn, cva, nanoId } from "./utils";

describe("cn() — property-based", () => {
  it("never returns falsy values in output (all items filterable)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.string(),
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(false),
          ),
        ),
        (classes) => {
          const result = cn(...classes);
          // Output should be a string (never undefined/null/NaN)
          expect(typeof result).toBe("string");
        },
      ),
      { numRuns: 1000 },
    );
  });

  it("joining with single class returns that class", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (cls) => {
        expect(cn(cls)).toBe(cls);
      }),
      { numRuns: 500 },
    );
  });

  it("is associative: cn(a, cn(b, c)) === cn(a, b, c)", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        expect(cn(a, cn(b, c))).toBe(cn(a, b, c));
      }),
      { numRuns: 500 },
    );
  });

  it("idempotent: cn(a, a) has same unique tokens as cn(a)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (cls) => {
          const once = cn(cls);
          const twice = cn(cls, cls);
          const tokensOnce = new Set(once.split(" ").filter(Boolean));
          const tokensTwice = new Set(twice.split(" ").filter(Boolean));
          // Unique token sets should be identical
          expect(tokensTwice.size).toBe(tokensOnce.size);
          for (const t of tokensOnce) expect(tokensTwice.has(t)).toBe(true);
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe("cva() — property-based", () => {
  it("without config always returns the base string", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (base) => {
        const instance = cva(base);
        expect(instance()).toBe(base);
      }),
      { numRuns: 500 },
    );
  });

  it("with config, default variants are always present", () => {
    const config = {
      variants: {
        color: { red: "text-red", blue: "text-blue" },
      },
      defaultVariants: { color: "red" },
    };
    const instance = cva("base", config);
    const result = instance();
    expect(result).toContain("text-red");
    expect(result).toContain("base");
  });

  it("overridden variant replaces default", () => {
    const config = {
      variants: {
        color: { red: "text-red", blue: "text-blue" },
      },
      defaultVariants: { color: "red" },
    };
    const instance = cva("base", config);
    const result = instance({ color: "blue" });
    expect(result).toContain("text-blue");
    expect(result).not.toContain("text-red");
  });

  it("arbitrary variant keys produce valid output", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (variantKey, variantValue) => {
          const config = {
            variants: { [variantKey]: { [variantValue]: `v-${variantValue}` } },
          };
          const instance = cva("base", config);
          const result = instance({ [variantKey]: variantValue });
          expect(result).toContain("base");
          expect(result).toContain(`v-${variantValue}`);
        },
      ),
      { numRuns: 300 },
    );
  });
});

describe("nanoId() — property-based", () => {
  it("without args returns a valid UUID v4", () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (let i = 0; i < 200; i++) {
      expect(nanoId()).toMatch(uuidRegex);
    }
  });

  it("with length arg returns hex string of exact length", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 64 }), (len) => {
        const id = nanoId(len);
        expect(id).toHaveLength(len);
        expect(id).toMatch(/^[0-9a-f]+$/i);
      }),
      { numRuns: 500 },
    );
  });

  it("generates unique IDs (collision resistance)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(nanoId());
    }
    expect(ids.size).toBe(100);
  });

  it("with length 1 returns single character", () => {
    expect(nanoId(1)).toHaveLength(1);
  });

  it("with length 0 returns empty string", () => {
    expect(nanoId(0)).toHaveLength(0);
  });
});
