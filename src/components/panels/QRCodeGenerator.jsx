import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeGenerator = () => {
    const [url, setUrl] = useState('');

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-full">
                <label 
                    htmlFor="qr-input" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Enter URL or text to generate QR code
                </label>
                <input
                    id="qr-input"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            {url && (
                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    <QRCodeSVG value={url} size={256} />
                </div>
            )}
        </div>
    );
};

export default QRCodeGenerator;