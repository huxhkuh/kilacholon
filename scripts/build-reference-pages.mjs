import fs from 'node:fs/promises';
import path from 'node:path';
import { categories } from '../src/data/content.ts';
import { sourceCatalog, entryFile } from './reference-catalog.mjs';

const catalog = await sourceCatalog();
const base = new URL(process.env.VITE_SITE_URL || 'https://huxhkuh.github.io/kilacholon/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const shell = await fs.readFile('dist/index.html', 'utf8');
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const plain = text => text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => label || catalog.find(entry => entry.slug === slug)?.title || slug).replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '$2').replace(/^[#=]+\s*|\s*=+$/gm, '').replace(/\*\*/g, '');
const urls = [];
async function page(route, title, description, body, entry) {
  const url = new URL(route, base).href;
  const structured = entry ? { '@context': 'https://schema.org', '@type': 'Article', headline: entry.title, description, inLanguage: 'he', dateModified: entry.updatedAt, mainEntityOfPage: url } : null;
  let html = shell.replace(/<title>.*?<\/title>/, `<title>${escape(title)} — מיכלכלה</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escape(url)}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escape(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escape(description)}" />`)
    .replace('<div id="root"></div>', `<div id="root"><main data-static-reference dir="rtl" lang="he" style="max-width:900px;margin:3rem auto;padding:1.5rem;font-family:Assistant,sans-serif;line-height:1.9"><nav><a href="${escape(base.href)}">מיכלכלה</a> · <a href="${escape(new URL('dictionary/?view=static', base).href)}">לכל ${catalog.length} הערכים</a></nav><h1>${escape(title)}</h1><p>${escape(description)}</p>${body}</main></div>`);
  if (structured) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</script></head>`);
    const payload = JSON.stringify({ contentFile: entryFile(entry), entry }).replace(/</g, '\\u003c');
    html = html.replace('</body>', `<script type="application/json" id="entry-data">${payload}</script></body>`);
  }
  const dir = path.join('dist', route);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'index.html'), html);
  urls.push({ url, updated: entry?.updatedAt });
}
for (const entry of catalog) {
  if (!/^[a-z0-9\u0590-\u05ff-]+$/.test(entry.slug)) throw new Error('Unsafe entry route');
  const paragraphs = plain(entry.fullDescription).split(/\n\n+/).map(text => `<p>${escape(text)}</p>`).join('');
  const sources = (entry.sources ?? []).filter(source => /^https?:\/\//.test(source.url)).map(source => `<li><a href="${escape(source.url)}" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join('');
  const points = (title, items) => items.length ? `<h2>${title}</h2><ul>${items.map(item => `<li>${escape(plain(item))}</li>`).join('')}</ul>` : '';
  const extra = `${entry.whyImportant ? `<h2>למה זה חשוב?</h2><p>${escape(plain(entry.whyImportant))}</p>` : ''}${entry.example ? `<h2>דוגמה</h2><p>${escape(plain(entry.example))}</p>` : ''}${points('מה אפשר ללמוד', entry.pros)}${points('מגבלות וטעויות נפוצות', entry.cons)}${entry.faq.map(item => `<h2>${escape(item.q)}</h2><p>${escape(plain(item.a))}</p>`).join('')}`;
  await page(`entry/${entry.slug}/`, entry.title, entry.shortDescription, `${paragraphs}${extra}${sources ? `<h2>מקורות והרחבה</h2><ul>${sources}</ul>` : ''}`, entry);
}
for (const category of categories) {
  const items = catalog.filter(entry => entry.category === category.slug).map(entry => `<li><a href="${escape(new URL(`entry/${entry.slug}/`, base).href)}">${escape(entry.title)}</a></li>`).join('');
  await page(`category/${category.slug}/`, category.name, category.description, `<ul>${items}</ul>`);
}
const dictionary = [...catalog].sort((a, b) => a.title.localeCompare(b.title, 'he'))
  .map(entry => `<li><a href="${escape(new URL(`entry/${entry.slug}/?view=static`, base).href)}">${escape(entry.title)}</a>${entry.contentStatus === 'stub' ? ' — קצרמר' : ''}<p>${escape(entry.shortDescription)}</p></li>`).join('');
await page('dictionary/', 'מילון מושגים', `כל ${catalog.length} הערכים — מלאים וקצרמרים.`, `<ul>${dictionary}</ul>`);
await page('', 'לומדים כלכלה, מבינים יותר', 'אנציקלופדיה שיתופית בעברית לכלכלה, שוק ההון וחיי היום־יום.', `<ul>${categories.map(category => `<li><a href="${new URL(`category/${category.slug}/`, base).href}">${escape(category.name)}</a></li>`).join('')}</ul>`);
await fs.writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(item => `<url><loc>${escape(item.url)}</loc>${item.updated ? `<lastmod>${escape(item.updated.slice(0, 10))}</lastmod>` : ''}</url>`).join('')}</urlset>`);
await fs.writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
console.log(`Built ${catalog.length} readable entry pages, ${categories.length} categories and sitemap.`);
