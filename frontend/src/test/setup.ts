import "@testing-library/jest-dom";

// Mock localStorage for zustand persist middleware
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
    key: (i: number): string | null => Object.keys(store)[i] ?? null,
  };
};

Object.defineProperty(globalThis, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
});

// Polyfill crypto.randomUUID used by canvasStore
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () =>
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
    },
    writable: true,
  });
}

// Polyfill requestAnimationFrame for non-browser test env
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (fn: FrameRequestCallback) =>
    setTimeout(fn, 16) as unknown as number;
}

// Polyfill structuredClone if not available
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = (obj: unknown) =>
    JSON.parse(JSON.stringify(obj));
}
