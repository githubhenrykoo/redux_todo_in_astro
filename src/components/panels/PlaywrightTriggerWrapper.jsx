import { useMemo } from 'react';
import PlaywrightTrigger from './playwrighttrigger.jsx';

const PlaywrightTriggerWrapper = () => {
    const playwrightApi = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        const playwright = params.get('run');
        
        // Check specifically for "clm" parameter
        if (playwright === 'clm') {
            return 'clm'; // This will map to /api/clm endpoint
        }
        return null; // Don't run if not explicitly "clm"
    }, []);

    return <PlaywrightTrigger playwrightApi={playwrightApi} />;
};

export default PlaywrightTriggerWrapper;
