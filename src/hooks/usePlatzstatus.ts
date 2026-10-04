import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPlatzStatus, loadCache, type PlatzStatusData } from '../lib/platzstatus';

interface State {
  data: PlatzStatusData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Lädt den Platzstatus beim ersten Rendern (mit sofortigem Cache-Stand aus
 * localStorage, damit sofort etwas zu sehen ist) und erlaubt manuellen
 * Refresh. Schlägt der Live-Abruf fehl, bleibt der zuletzt bekannte Stand
 * stehen und `error` wird gesetzt – die UI zeigt dann Zeitstempel + Hinweis.
 */
export function usePlatzstatus() {
  const [state, setState] = useState<State>(() => ({
    data: loadCache(),
    loading: true,
    error: null,
  }));
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchPlatzStatus();
      if (mounted.current) setState({ data, loading: false, error: null });
    } catch (e) {
      if (mounted.current) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e.message : 'Abruf fehlgeschlagen.',
        }));
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  return { ...state, refresh };
}
