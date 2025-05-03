import { useEffect, useState } from 'react';

const PlaywrightTrigger = ({ playwrightApi }) => {
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!playwrightApi) return;
        const triggerPlaywrightTest = async () => {
            setStatus('running');
            setError(null);
            try {
                const response = await fetch(`/api/${playwrightApi}`, {
                    method: 'POST'
                });
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
                setStatus('completed');
            } catch (err) {
                setStatus('error');
                setError(err.message);
            }
        };

        triggerPlaywrightTest();
    }, [playwrightApi]);

    return (
        <div className="p-4">
            <h2 className="text-lg font-bold mb-2">Playwright Test Trigger</h2>
            <div>
                Status: <span className={
                    status === 'running' ? 'text-yellow-600' :
                    status === 'completed' ? 'text-green-600' :
                    status === 'error' ? 'text-red-600' : ''
                }>
                    {status}
                </span>
            </div>
            {error && (
                <div className="text-red-600 mt-2">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default PlaywrightTrigger;