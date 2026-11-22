const store = globalThis as typeof globalThis & { __singletons?: Map<string, unknown> };

export function singleton<T>(key: string, create: () => T): T {
  store.__singletons ??= new Map();
  if (!store.__singletons.has(key)) store.__singletons.set(key, create());
  return store.__singletons.get(key) as T;
}
