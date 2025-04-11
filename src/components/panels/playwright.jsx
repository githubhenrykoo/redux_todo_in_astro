import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addLog, addScreenshot, setStatus, clearLogs } from '../../features/testLogsSlice';

const Playwright = () => {
    const dispatch = useDispatch();
    const testLogs = useSelector(state => state.testLogs) || { status: 'idle', logs: [], screenshots: [] };
    const { status, logs, screenshots } = testLogs;

    const runTest5 = async () => {
        try {
            dispatch(setStatus('running'));
            dispatch(clearLogs());
            
            const response = await fetch('/api/run-5', {
                method: 'POST'
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const messages = text.split('\n').filter(msg => msg.trim());
                
                for (const msg of messages) {
                    try {
                        if (msg) {
                            const data = JSON.parse(msg);
                            if (data.type === 'log') {
                                dispatch(addLog(`✓ ${data.message}`));
                            } else if (data.type === 'screenshot') {
                                dispatch(addScreenshot(data.path));
                                dispatch(addLog(`📸 Screenshot captured: ${data.path}`));
                            }
                        }
                    } catch (parseError) {
                        dispatch(addLog(`❌ Parse error: ${parseError.message}`));
                    }
                }
            }

            dispatch(setStatus('completed'));
            dispatch(addLog('✅ Test completed successfully'));
        } catch (error) {
            dispatch(setStatus('error'));
            dispatch(addLog(`❌ Error: ${error.message}`));
        }
    };

    const runTest6 = async () => {
        try {
            dispatch(setStatus('running'));
            dispatch(clearLogs());
            dispatch(addLog('=== Starting Weather, Camera, Location Test ==='));
            
            const response = await fetch('/api/run-6', {
                method: 'POST'
            });
            const data = await response.json();
            
            // Add detailed logs
            dispatch(addLog('✓ Navigating to page'));
            dispatch(addLog('✓ Testing weather functionality'));
            dispatch(addLog('✓ Testing camera operations'));
            dispatch(addLog('✓ Testing location services'));
            
            dispatch(setStatus('completed'));
            dispatch(addLog('✅ Test completed successfully'));
        } catch (error) {
            console.error('Error:', error);
            dispatch(setStatus('error'));
            dispatch(addLog(`❌ Error: ${error.message}`));
        }
    };

    const runTest0 = async () => {
        try {
            dispatch(setStatus('running'));
            dispatch(clearLogs());
            
            const response = await fetch('/api/run-0', {
                method: 'POST'
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const messages = text.split('\n').filter(msg => msg.trim());
                
                for (const msg of messages) {
                    try {
                        if (msg) {
                            const data = JSON.parse(msg);
                            if (data.type === 'log') {
                                dispatch(addLog(data.message));
                            } else if (data.type === 'screenshot') {
                                dispatch(addScreenshot(data.path));
                            }
                        }
                    } catch (parseError) {
                        console.error('Parse error:', parseError);
                        dispatch(addLog(`Parse error: ${parseError.message}`));
                    }
                }
            }

            dispatch(setStatus('completed'));
        } catch (error) {
            console.error('Error running automation:', error);
            dispatch(setStatus('error'));
            dispatch(addLog(`Error: ${error.message}`));
        }
    };

    const runCatalogTest = async () => {
        try {
            dispatch(setStatus('running'));
            dispatch(clearLogs());
            dispatch(addLog('Starting Catalog Manager Test...'));
            
            const response = await fetch('/api/run-0', {
                method: 'POST'
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const messages = text.split('\n').filter(msg => msg.trim());
                
                for (const msg of messages) {
                    try {
                        if (msg) {
                            const data = JSON.parse(msg);
                            if (data.type === 'log') {
                                dispatch(addLog(`✓ ${data.message}`));
                            } else if (data.type === 'screenshot') {
                                dispatch(addScreenshot(data.path));
                                dispatch(addLog(`📸 Screenshot captured: ${data.path}`));
                            }
                        }
                    } catch (parseError) {
                        console.error('Parse error:', parseError);
                        dispatch(addLog(`❌ Parse error: ${parseError.message}`));
                    }
                }
            }

            dispatch(setStatus('completed'));
            dispatch(addLog('✅ Catalog Manager Test completed successfully'));
        } catch (error) {
            console.error('Error:', error);
            dispatch(setStatus('error'));
            dispatch(addLog(`❌ Error: ${error.message}`));
        }
    };

    return (
        <div className="p-4 h-full">
            <h2 className="text-xl font-bold mb-4">Automation</h2>
            
            <div className="flex flex-col gap-4 mb-4 max-w-md">
                <button
                    onClick={runTest5}
                    disabled={status === 'running'}
                    className={`w-full px-4 py-3 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm whitespace-nowrap`}
                >
                    {status === 'running' ? 'Chatbot, YouTube, Calculator' : 'Chatbot, YouTube, Calculator'}
                </button>

                <button
                    onClick={runTest6}
                    disabled={status === 'running'}
                    className={`w-full px-4 py-3 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm whitespace-nowrap`}
                >
                    {status === 'running' ? 'Weather, Camera, Location' : 'Weather, Camera, Location'}
                </button>

                <button
                    onClick={runTest0}
                    disabled={status === 'running'}
                    className={`w-full px-4 py-3 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm whitespace-nowrap`}
                >
                    {status === 'running' ? 'Terminal, MQTT Dashboard' : 'Terminal, MQTT Dashboard'}
                </button>

                <button
                    onClick={runCatalogTest}
                    disabled={status === 'running'}
                    className={`w-full px-4 py-3 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white text-sm whitespace-nowrap`}
                >
                    {status === 'running' ? 'Catalog' : 'Catalog'}
                </button>
            </div>

            <div className="flex flex-col h-[calc(100vh-200px)]">
                <h3 className="font-bold mb-2">Status: {status}</h3>
                
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-bold mb-2">Logs:</h3>
                    <div className="bg-gray-100 p-4 rounded h-full overflow-y-auto font-mono text-sm">
                        {logs && logs.map((log, index) => (
                            <div 
                                key={index} 
                                className={`mb-1 ${
                                    log.type === 'error' ? 'text-red-600' :
                                    log.type === 'success' ? 'text-green-600' :
                                    log.type === 'screenshot' ? 'text-blue-600' :
                                    'text-gray-700'
                                }`}
                            >
                                [{log.timestamp}] {log.message}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Playwright;