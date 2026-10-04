import { useEffect, useState } from 'react';

/** useState, das seinen Wert in localStorage überlebt. */
export function useSticky<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // egal – dann eben nur für diese Sitzung
    }
  }, [key, value]);

  return [value, setValue] as const;
}
