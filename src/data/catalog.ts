import { entries as seedEntries, type Entry } from './content';

// Build/test publication gate only. The browser uses reference.ts: a complete
// index plus independently fetched articles, never these all-or-nothing chunks.
const modules = import.meta.glob<Entry[]>('./expansion/*.json', { import: 'default' });
export async function loadCatalog(): Promise<Entry[]> {
  const topics = await Promise.all(Object.values(modules).map(load => load()));
  return [...seedEntries, ...topics.flat()];
}
