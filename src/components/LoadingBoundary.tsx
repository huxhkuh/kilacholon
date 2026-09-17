import { Component, type ReactNode } from 'react';
import { appUrl } from '@/lib/urls';

/** A failed route import must never leave an unexplained blank screen. */
export default class LoadingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'static');
    return <main dir="rtl" className="container py-16 max-w-3xl">
      <h1 className="heading-display text-3xl text-primary mb-4">לא ניתן לטעון את הממשק כרגע</h1>
      <p role="alert">ייתכן שחיבור הרשת נקטע או שקובץ לא היה זמין. אפשר לנסות שוב.</p>
      <div className="flex flex-wrap gap-5 mt-5">
        <button className="text-link" onClick={() => window.location.reload()}>טעינה מחדש</button>
        {/\/entry\//.test(url.pathname) && <a className="text-link" href={url.href}>פתיחת דף הקריאה</a>}
        <a className="text-link" href={appUrl('/dictionary')}>לכל הערכים</a>
      </div>
    </main>;
  }
}
