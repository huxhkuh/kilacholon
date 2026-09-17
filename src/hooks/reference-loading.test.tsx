import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadCatalog } from '@/data/catalog';
import { embeddedArticle, referenceEntries, referenceBySlug } from '@/data/reference';
import { searchEntries, readingMinutes } from '@/lib/entry-search';
import { usePublishedEntries } from './usePublishedEntries';
import EntryPage from '@/pages/EntryPage';
import EditEntry from '@/pages/EditEntry';
import Dictionary from '@/pages/Dictionary';
import PublishedComparison from '@/components/wiki/PublishedComparison';
import { readDraft, writeDraft } from '@/lib/edit-drafts';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'editor' }, isEditor: true, loading: false }) }));
vi.mock('@/components/Layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => {
  const query = { select: () => query, eq: () => query, order: () => query, range: () => query,
    abortSignal: () => Promise.resolve({ data: [], error: null }) };
  return query;
} } }));

const catalog = await loadCatalog();
const first = catalog.find(entry => entry.slug === 'micro-opportunity-cost')!;
const other = catalog.find(entry => entry.slug.startsWith('fin-'))!;
let client: QueryClient;
const request = vi.fn();
const ok = (entry: unknown) => ({ ok: true, json: async () => entry });
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
function mountPage(slug: string, editor = false) {
  const path = editor ? '/edit/:slug' : '/entry/:slug';
  return render(<MemoryRouter initialEntries={[`/${editor ? 'edit' : 'entry'}/${slug}`]}><Routes>
    <Route path={path} element={editor ? <EditEntry /> : <EntryPage />} />
  </Routes></MemoryRouter>, { wrapper });
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Keep tests quick while production still retries a transient failure once.
  client.setQueryDefaults(['reference-entry'], { retryDelay: 0 });
  localStorage.clear();
  request.mockReset();
  vi.stubGlobal('fetch', request);
});
afterEach(() => { cleanup(); client.clear(); vi.unstubAllGlobals(); document.getElementById('entry-data')?.remove(); });

it('has all 623 titles, correct reading times and full-text search before any article request', () => {
  const { result } = renderHook(() => usePublishedEntries(), { wrapper });
  expect(result.current.entries).toHaveLength(623);
  expect(result.current.isLoading).toBe(false);
  expect(request).not.toHaveBeenCalled();
  for (const source of catalog) {
    const indexed = referenceBySlug.get(source.slug)!;
    expect(readingMinutes(indexed)).toBe(readingMinutes(source));
  }
  for (const query of ['החלופה הטובה', 'ירידת מחירים', 'שינוי בריבית', 'תכנון מרכזי', 'מיסוי הכנסות', 'מחסור', 'שכר', 'תחרות']) {
    expect(searchEntries(referenceEntries, query).map(entry => entry.slug)).toEqual(searchEntries(catalog, query).map(entry => entry.slug));
  }
});

it('can display every dictionary entry without any article-body requests', () => {
  const view = render(<MemoryRouter><Dictionary /></MemoryRouter>, { wrapper });
  expect(view.container.querySelectorAll('.dictionary-entry')).toHaveLength(60);
  fireEvent.click(screen.getByRole('button', { name: 'הצגת כל 623 הערכים' }));
  expect(view.container.querySelectorAll('.dictionary-entry')).toHaveLength(623);
  expect(request).not.toHaveBeenCalled();
});

it('isolates a blocked article, keeps 623 entries and allows a real retry without refreshing', async () => {
  request.mockResolvedValue({ ok: false, status: 418 });
  const { result, rerender } = renderHook(({ slug }) => usePublishedEntries(slug), { wrapper, initialProps: { slug: first.slug } });
  await waitFor(() => expect(result.current.catalogError).toBeTruthy());
  expect(result.current.entries).toHaveLength(623);
  expect(result.current.entries.find(entry => entry.slug === other.slug)).toBeTruthy();
  request.mockResolvedValue(ok(other));
  rerender({ slug: other.slug });
  await waitFor(() => expect(result.current.entries.find(entry => entry.slug === other.slug)?.fullDescription).toBe(other.fullDescription));
  expect(result.current.catalogError).toBeNull();
  // Both requests use the selected article's resource, never a whole topic.
  expect(request.mock.calls.every(([url]) => String(url).includes('/reference/'))).toBe(true);
  request.mockResolvedValue(ok(first));
  rerender({ slug: first.slug });
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.entries.find(entry => entry.slug === first.slug)?.fullDescription).toBe(first.fullDescription));
  expect(result.current.entries).toHaveLength(623);
});

it('uses a matching embedded article with no content request', async () => {
  const data = document.createElement('script');
  data.id = 'entry-data'; data.type = 'application/json';
  data.textContent = JSON.stringify({ contentFile: referenceBySlug.get(first.slug)!.contentFile, entry: first });
  document.body.append(data);
  const { result } = renderHook(() => usePublishedEntries(first.slug), { wrapper });
  expect(result.current.entries.find(entry => entry.slug === first.slug)?.fullDescription).toBe(first.fullDescription);
  expect(result.current.isLoading).toBe(false);
  expect(request).not.toHaveBeenCalled();
  expect(embeddedArticle(referenceBySlug.get(other.slug))).toBeUndefined();
  data.textContent = JSON.stringify({ contentFile: 'old-version.json', entry: first });
  expect(embeddedArticle(referenceBySlug.get(first.slug))).toBeUndefined();
});

it('shows a load failure, title and static reading link instead of saying a known article does not exist', async () => {
  request.mockResolvedValue({ ok: false, status: 418 });
  mountPage(first.slug);
  await screen.findByRole('alert');
  expect(screen.getByRole('heading', { name: first.title })).toBeTruthy();
  expect(screen.queryByText('הערך לא נמצא')).toBeNull();
  expect(screen.getByRole('link', { name: 'פתיחת דף הקריאה' }).getAttribute('href')).toContain(`/entry/${first.slug}/?view=static`);
  request.mockResolvedValue(ok(first));
  fireEvent.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));
  await screen.findByRole('heading', { name: 'מחיר שאינו מופיע בקבלה' });
  expect(screen.queryByRole('alert')).toBeNull();
});

it('rejects malformed or wrong-article payloads without rendering them', async () => {
  request.mockResolvedValue(ok(other));
  const { result } = renderHook(() => usePublishedEntries(first.slug), { wrapper });
  await waitFor(() => expect(result.current.catalogError).toBeTruthy());
  expect(result.current.entries.find(entry => entry.slug === first.slug)?.fullDescription).toBe('');
  expect(result.current.entries).toHaveLength(623);
});

it('does not overwrite a local editor draft when the article request fails', async () => {
  request.mockResolvedValue({ ok: false, status: 503 });
  writeDraft(first.slug, { title: 'הטיוטה שלי', category: first.category, summary: 'תקציר', content: 'תוכן מקומי חשוב', tagsRaw: '', changeSummary: '', isStub: false, defField: '', explField: '', exField: '', expandMode: false });
  const view = mountPage(first.slug, true);
  await screen.findByText('הערך אינו זמין לעריכה');
  expect(readDraft(first.slug)?.content).toBe('תוכן מקומי חשוב');
  request.mockResolvedValue(ok(first));
  fireEvent.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));
  await screen.findByDisplayValue('תוכן מקומי חשוב');
  view.unmount();
  expect(readDraft(first.slug)?.content).toBe('תוכן מקומי חשוב');
});

it('loads the actual published body before showing a revision comparison', async () => {
  request.mockResolvedValue(ok(first));
  const view = render(<PublishedComparison slug={first.slug} content="תוכן מתוקן" />, { wrapper });
  expect(request).not.toHaveBeenCalled();
  const details = view.container.querySelector('details')!;
  details.open = true; fireEvent(details, new Event('toggle'));
  await screen.findByText(first.fullDescription.split('\n')[0]);
  expect(request).toHaveBeenCalledTimes(1);
  expect(screen.getByText('תוכן מתוקן')).toBeTruthy();
});
