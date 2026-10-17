// Polyfill browser globals for node test environment if needed
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = globalThis;
}
if (typeof (globalThis as any).sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}
