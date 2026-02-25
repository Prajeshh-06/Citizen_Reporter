'use client';

import { useEffect } from 'react';

export function usePolling(fetchFunction, intervalMs = 15000) {
    useEffect(() => {
        if (!fetchFunction) return;

        let timeoutId;

        const poll = async () => {
            if (document.visibilityState === 'visible') {
                await fetchFunction(true); // pass true flag to indicate background poll (optional, to avoid loading spinners)
            }
            timeoutId = setTimeout(poll, intervalMs);
        };

        timeoutId = setTimeout(poll, intervalMs);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchFunction(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchFunction, intervalMs]);
}
