import { usePublishedEntries } from '@/hooks/usePublishedEntries';

export default function ContentStatus() {
  const { communityError, retry } = usePublishedEntries();
  if (!communityError) return null;
  return <div className="container mt-4" role="status"><div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 px-4 py-3 text-sm">
    <span>עדכוני הקהילה אינם זמינים כרגע. אפשר להמשיך לקרוא את ספריית הערכים.</span>
    <button onClick={retry} className="font-semibold text-primary underline underline-offset-4">ניסיון נוסף</button>
  </div></div>;
}
