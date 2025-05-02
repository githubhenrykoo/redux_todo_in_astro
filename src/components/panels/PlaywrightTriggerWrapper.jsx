import React, { useMemo } from 'react';
import PlaywrightTrigger from './playwrighttrigger.jsx';

const PlaywrightTriggerWrapper = () => {
    const playwrightApi = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const playwright = params.get('run');
        if (playwright) {
            // Allow both "run-5" and "5"
            return playwright.startsWith('run-') ? playwright : `run-${playwright}`;
        }
        return 'run-5';
    }, []);

    return <PlaywrightTrigger playwrightApi={playwrightApi} />;
};

export default PlaywrightTriggerWrapper;// ... existing code ...
