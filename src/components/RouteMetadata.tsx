import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { appUrl } from '@/lib/urls';
import { getCategory } from '@/data/content';

export default function RouteMetadata() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', appUrl(pathname));
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots); }
    robots.content = /^\/(auth|profile|edit|admin|search)(\/|$)/.test(pathname) ? 'noindex,follow' : 'index,follow';
    if (!pathname.startsWith('/entry/')) {
      const titles: Record<string, string> = { '/': 'להבין כלכלה, מושג אחד בכל פעם', '/categories': 'תחומי הידע', '/dictionary': 'מילון מושגים', '/search': 'חיפוש ערכים', '/help/wiki-syntax': 'מדריך לכותבים' };
      const route = pathname.replace(/\/$/, '') || '/';
      const title = route.startsWith('/category/') ? getCategory(route.slice(10))?.name : titles[route];
      if (title) document.title = `${title} — מיכלכלה`;
      const description = 'אנציקלופדיה שיתופית בעברית לכלכלה, שוק ההון וחיי היום־יום. הסברים, דוגמאות ומקורות במקום אחד.';
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', 'מיכלכלה — להבין כלכלה');
    }
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
