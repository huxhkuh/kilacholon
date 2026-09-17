import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { sourceCatalog, entryFile } from './reference-catalog.mjs';

const catalog = await sourceCatalog();
const index = JSON.parse(await fs.readFile('src/data/generated/reference-index.json', 'utf8'));
for (const entry of catalog) {
  const file = entryFile(entry);
  const payload = JSON.parse(await fs.readFile(`dist/reference/${file}`, 'utf8'));
  assert.deepEqual(payload, entry, `${entry.slug}: independent payload mismatch`);
  const html = await fs.readFile(`dist/entry/${entry.slug}/index.html`, 'utf8');
  const embedded = html.match(/<script type="application\/json" id="entry-data">([^]*?)<\/script>/)?.[1];
  assert(embedded, `${entry.slug}: missing direct-link content`);
  assert.deepEqual(JSON.parse(embedded), { contentFile: file, entry }, `${entry.slug}: bootstrap mismatch`);
  assert(html.includes('data-static-reference'), `${entry.slug}: static reading missing`);
  const metadata = index.find(item => item.slug === entry.slug);
  if (metadata) assert.equal(metadata.contentFile, file);
}
const dictionary = await fs.readFile('dist/dictionary/index.html', 'utf8');
assert.equal((dictionary.match(/\/entry\/[^"\s]+\/\?view=static/g) ?? []).length, catalog.length);
const assets = await fs.readdir('dist/assets');
assert(!assets.some(name => /^(micro|macro|finance|household|methods)-.*\.js$/.test(name)), 'Obsolete topic chunks must not be shipped');
console.log(`Verified ${catalog.length} complete article payloads, embedded articles and static dictionary links; no topic chunks.`);
