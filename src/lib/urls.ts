export function appUrl(path: string, origin = window.location.origin, base = import.meta.env.BASE_URL) {
  const normalizedBase = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') + '/';
  let relative = path.replace(/^\/+/, '');
  if (/^(entry|category)\//.test(relative) && !relative.endsWith('/')) relative += '/';
  return new URL(normalizedBase + relative, origin).href;
}

export function isSafeExternalUrl(value: string) {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}
