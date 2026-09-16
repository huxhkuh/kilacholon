/** localStorage is optional: privacy mode/quota errors must never break reading. */
const memory = new Map<string, string[]>();
const failedWrites = new Set<string>();

export function readList(key: string): string[] {
  if (failedWrites.has(key)) return memory.get(key) ?? [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return memory.get(key) ?? [];
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];
  } catch { return memory.get(key) ?? []; }
}

export function writeList(key: string, values: string[]): boolean {
  const clean = [...new Set(values)].slice(-3000);
  memory.set(key, clean);
  let persisted = true;
  try { localStorage.setItem(key, JSON.stringify(clean)); failedWrites.delete(key); }
  catch { persisted = false; failedWrites.add(key); }
  window.dispatchEvent(new CustomEvent('michlchala:list-change', { detail: key }));
  return persisted;
}
