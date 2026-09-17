import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { entries } from '../src/data/content.ts';

export async function sourceCatalog() {
  const folder = 'src/data/expansion';
  const files = (await fs.readdir(folder)).filter(file => file.endsWith('.json')).sort();
  const additions = (await Promise.all(files.map(async file => JSON.parse(await fs.readFile(path.join(folder, file), 'utf8'))))).flat();
  return [...entries, ...additions];
}

export function entryFile(entry) {
  const hash = createHash('sha256').update(JSON.stringify(entry)).digest('hex').slice(0, 16);
  return `${entry.slug}.${hash}.json`;
}
