import { entries as seedEntries, type Entry } from './content';

// Load the large reference library once, independently of the application shell.
const modules = import.meta.glob<Entry[]>('./expansion/*.json', { import: 'default' });
export async function loadCatalog(): Promise<Entry[]> {
  const topics = await Promise.all(Object.values(modules).map(load => load()));
  return [...seedEntries, ...topics.flat()];
}
