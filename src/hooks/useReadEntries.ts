import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mikhlala:read-entries";
const CHANGE_EVENT = "mikhlala:read-entries-change";

function readStoredSlugs() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    isRead: (slug: string) => readSlugs.has(slug),
    markRead,
    readCount: readSlugs.size,
  };
}
