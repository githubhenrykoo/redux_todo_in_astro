import React, { useEffect, useState, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

const MapPanel = ({ className = '' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState({});

  // Mock MQTT connection and data
  const mockMqttData = () => {
    // Generate random data for each device
    const updatedSensorData = {};
    devices.forEach(device => {
      updatedSensorData[device.id] = {
        tegangan: (Math.random() * 10 + 220).toFixed(1),
        arus: (Math.random() * 5).toFixed(2),
        daya: (Math.random() * 1000 + 500).toFixed(0),
        kwh: (Math.random() * 50 + 100).toFixed(1),
        pf: (Math.random() * 0.2 + 0.8).toFixed(2),
        biaya: (Math.random() * 100000 + 50000).toFixed(0),
        lastUpdate: new Date().toISOString()
      };
    });
    setSensorData(updatedSensorData);
    
    // Update popups for all markers
    Object.keys(markersRef.current).forEach(deviceId => {
      const marker = markersRef.current[deviceId];
      if (marker && marker.getPopup()) {
        marker.setPopupContent(renderDevicePopup(deviceId));
      }
    });
  };

  // Initialize mock devices
  useEffect(() => {
    // Mock device data
    const mockDevices = [
      { 
        id: 'PDM001', 
        name: 'Power Meter 1',
        location: 'Building A',
        latlong: '-8.6773879009797,115.22863462372545'
      },
      { 
        id: 'PDM002', 
        name: 'Power Meter 2',
        location: 'Building B',
        latlong: '-8.6793879009797,115.22963462372545'
      },
      { 
        id: 'PDM003', 
        name: 'Power Meter 3',
        location: 'Building C',
        latlong: '-8.6753879009797,115.22763462372545'
      }
    ];
    
    setDevices(mockDevices);
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import Leaflet dynamically to avoid SSR issues
      import('leaflet').then(L => {
        if (!mapInstanceRef.current && mapRef.current) {
          // Initialize map
          mapInstanceRef.current = L.map(mapRef.current, {
            center: [-8.6773879009797, 115.22863462372545],
            zoom: 15,
            zoomControl: true
          });

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(mapInstanceRef.current);

          // Force map to re-render
          setTimeout(() => {
            mapInstanceRef.current.invalidateSize();
          }, 100);
        }
      });
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add markers when devices are loaded
  useEffect(() => {
    if (mapInstanceRef.current && devices.length > 0) {
      import('leaflet').then(L => {
        // Clear existing markers
        Object.values(markersRef.current).forEach(marker => {
          marker.remove();
        });
        markersRef.current = {};

        // Add markers for each device
        devices.forEach(device => {
          if (device.latlong && device.latlong.includes(',')) {
            const [lat, lng] = device.latlong.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
              // Create marker
              const marker = L.marker([lat, lng], {
                title: device.id
              }).addTo(mapInstanceRef.current);
              
              // Add popup
              marker.bindPopup(renderDevicePopup(device.id));
              
              // Add tooltip with device ID
              marker.bindTooltip(device.id, {
                permanent: true,
                direction: 'top',
                offset: [0, -10],
                className: 'device-id-tooltip'
              });
              
              // Store marker reference
              markersRef.current[device.id] = marker;
            }
          }
        });
      });
    }
  }, [devices]);

  // Simulate MQTT data updates
  useEffect(() => {
    if (devices.length > 0) {
      // Initial data
      mockMqttData();
      
      // Update data every 5 seconds
      const interval = setInterval(mockMqttData, 5000);
      
      return () => clearInterval(interval);
    }
  }, [devices]);

  // Render device popup content
  const renderDevicePopup = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    const data = sensorData[deviceId] || {
      tegangan: '-', arus: '-', daya: '-', kwh: '-', pf: '-', biaya: '-'
    };
    
    if (!device) return '';
    
    return `
      <div class="device-popup">
        <h3 class="text-lg font-bold mb-2">${device.name}</h3>
        <p class="text-sm text-gray-600 mb-3">${device.location}</p>
        <table class="w-full text-sm">
          <tr>
            <td class="py-1 font-medium">Tegangan</td>
            <td class="py-1">${data.tegangan} V</td>
          </tr>
          <tr>
            <td class="py-1 font-medium">Arus</td>
            <td class="py-1">${data.arus} A</td>
          </tr>
          <tr>
            <td class="py-1 font-medium">Daya</td>
            <td class="py-1">${data.daya} W</td>
          </tr>
          <tr>
            <td class="py-1 font-medium">kWh</td>
            <td class="py-1">${data.kwh}</td>
          </tr>
          <tr>
            <td class="py-1 font-medium">PF</td>
            <td class="py-1">${data.pf}</td>
          </tr>
          <tr>
            <td class="py-1 font-medium">Biaya</td>
            <td class="py-1">Rp ${data.biaya}</td>
          </tr>
        </table>
        <p class="text-xs text-gray-500 mt-2">Last update: ${data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : '-'}</p>
      </div>
    `;
  };

  return (
    <div className={`h-full w-full flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg font-medium">IoT Device Map</h2>
        </div>
        <div className="text-sm text-gray-500">
          {devices.length} devices online
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div 
          ref={mapRef} 
          className="absolute inset-0 z-0"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Device Data Panel */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium mb-2">Device Summary</h3>
        <div className="grid grid-cols-3 gap-3">
          {devices.map(device => (
            <div key={device.id} className="bg-white p-2 rounded shadow-sm">
              <div className="font-medium text-sm">{device.id}</div>
              <div className="text-xs text-gray-500">{device.name}</div>
              <div className="mt-1 text-sm">
                {sensorData[device.id] ? (
                  <span className="text-green-500">Online</span>
                ) : (
                  <span className="text-red-500">Offline</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for tooltips */}
      <style jsx>{`
        :global(.device-id-tooltip) {
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-weight: bold;
          color: #333;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          pointer-events: none;
        }
        :global(.device-id-tooltip:before) {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          margin-left: -5px;
          border-width: 5px 5px 0;
          border-style: solid;
          border-color: white transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default MapPanel;
