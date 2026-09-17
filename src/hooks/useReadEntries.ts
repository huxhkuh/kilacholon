import { useCallback, useEffect, useState } from "react";
import { readList, writeList } from '@/lib/localLists';

const STORAGE_KEY = "mikhlala:read-entries";
const CHANGE_EVENT = "mikhlala:read-entries-change";

function readStoredSlugs() {
  return new Set(readList(STORAGE_KEY));
}

export function useReadEntries() {
  const [readSlugs, setReadSlugs] = useState<Set<string>>(() => readStoredSlugs());

  useEffect(() => {
    const update = () => setReadSlugs(readStoredSlugs());
    window.addEventListener("storage", update);
    window.addEventListener(CHANGE_EVENT, update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener(CHANGE_EVENT, update);
    };
  }, []);

  const markRead = useCallback((slug: string) => {
    const next = readStoredSlugs();
    if (next.has(slug)) return;
    next.add(slug);
    writeList(STORAGE_KEY, Array.from(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    isRead: (slug: string) => readSlugs.has(slug),
    markRead,
    readCount: readSlugs.size,
  };
}
