import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { readList, writeList } from '@/lib/localLists';

const KEY = 'michlchala:saved:v1';
export function useSavedEntries() {
  const [savedSlugs, setSavedSlugs] = useState(() => readList(KEY));
  useEffect(() => {
    const update = () => setSavedSlugs(readList(KEY));
    window.addEventListener('storage', update);
    window.addEventListener('michlchala:list-change', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('michlchala:list-change', update);
    };
  }, []);
  const toggleSaved = useCallback((slug: string) => {
    const current = readList(KEY);
    const removing = current.includes(slug);
    const persisted = writeList(KEY, removing ? current.filter(item => item !== slug) : [...current, slug]);
    toast.message(persisted ? removing ? 'הערך הוסר מרשימת הקריאה' : 'הערך נשמר לקריאה במכשיר הזה' : 'הדפדפן חסם שמירה. הרשימה זמינה עד סגירת העמוד.');
  }, []);
  return { savedSlugs, savedCount: savedSlugs.length, isSaved: (slug: string) => savedSlugs.includes(slug), toggleSaved };
}
