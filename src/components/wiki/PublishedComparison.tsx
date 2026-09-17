import { useState } from 'react';
import { usePublishedEntries } from '@/hooks/usePublishedEntries';
import { revisionDiff } from '@/lib/revisionDiff';
import { Button } from '@/components/ui/button';

function ComparisonBody({ slug, content }: { slug: string; content: string }) {
  const { entries, isLoading, isCommunityLoading, catalogError, communityError, retry } = usePublishedEntries(slug);
  if (isLoading || isCommunityLoading) return <p role="status">טוען את הגרסה שפורסמה…</p>;
  if (catalogError || communityError) return <div role="alert"><p>לא ניתן לטעון את הגרסה להשוואה.</p><Button variant="outline" onClick={retry}>ניסיון נוסף</Button></div>;
  const entry = entries.find(item => item.slug === slug);
  return <div className="mt-3 text-sm whitespace-pre-wrap max-h-96 overflow-auto" dir="rtl">
    {revisionDiff(entry?.fullDescription ?? '', content).map((line, index) => <div key={index} className={line.type === 'added' ? 'bg-emerald-50 text-emerald-950' : line.type === 'removed' ? 'bg-rose-50 text-rose-950 line-through' : ''}>
      <span className="inline-block w-5" aria-label={line.type === 'added' ? 'נוסף' : line.type === 'removed' ? 'הוסר' : ''}>{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}</span>{line.text || ' '}
    </div>)}
  </div>;
}

export default function PublishedComparison(props: { slug: string; content: string }) {
  const [open, setOpen] = useState(false);
  return <details className="rounded-md border border-border mb-4 p-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="font-semibold text-primary cursor-pointer">השוואה לערך שפורסם</summary>
    {open && <ComparisonBody {...props} />}
  </details>;
}
