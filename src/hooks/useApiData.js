/**
 * useApiData — Smart data fetching hook
 * Tries FastAPI backend first, falls back to local sample data
 */
import { useState, useEffect, useRef } from 'react';
import { checkBackend } from '../services/api';

export function useApiData(apiFetcher, localFallback, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('local'); // 'api' | 'local'
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                // Try API first
                const apiResult = apiFetcher ? await apiFetcher() : null;
                if (!cancelled && apiResult !== null) {
                    setData(apiResult);
                    setSource('api');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.warn('API fetch failed, using local data:', err);
            }

            // Fallback to local data
            if (!cancelled) {
                const local = typeof localFallback === 'function' ? localFallback() : localFallback;
                setData(local);
                setSource('local');
                setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
            mounted.current = false;
        };
    }, deps);

    return { data, loading, source };
}

export function useBackendStatus() {
    const [isAvailable, setIsAvailable] = useState(null);

    useEffect(() => {
        checkBackend().then(setIsAvailable);
    }, []);

    return isAvailable;
}
