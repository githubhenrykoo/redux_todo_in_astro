'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * Simple MQTT Dashboard Panel that uses the browser's window object to load MQTT
 * and avoids issues with server-side rendering
 */
const SimpleMQTTDashboardPanel = () => {
  // State hooks for all dashboard values
  const [connectionStatus, setConnectionStatus] = useState('Waiting for MQTT library...');
  const [currentTemp, setCurrentTemp] = useState('--');
  const [voltage, setVoltage] = useState('--');
  const [current, setCurrent] = useState('--');
  const [power, setPower] = useState('--');
  const [kwh, setKwh] = useState('--');
  const [powerFactor, setPowerFactor] = useState('--');
  const [customText, setCustomText] = useState('');
  
  // References for Chart.js canvas and MQTT client
  const chartCanvasRef = useRef(null);
  const mqttClientRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  // Utility function to load external scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };
  
  // Initialize everything
  useEffect(() => {
    let mqttClient = null;
    let chartInstance = null;
    const tempData = {
      labels: [],
      datasets: [{
        label: 'Temperature (°C)',
        data: [],
        fill: false,
        borderColor: '#03dac5',
        tension: 0.3
      }]
    };
    
    const initializeDashboard = async () => {
      try {
        // Load required scripts
        setConnectionStatus('Loading required libraries...');
        await Promise.all([
          loadScript('https://unpkg.com/mqtt/dist/mqtt.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/chart.js')
        ]);
        setConnectionStatus('Libraries loaded, connecting to broker...');
        
        // Connect to MQTT broker when scripts are loaded
        if (window.mqtt) {
          const broker = 'wss://1115a4b6fe5c40e588a3a85468f3c8be.s1.eu.hivemq.cloud:8884/mqtt';
          const options = {
            connectTimeout: 4000,
            clientId: 'webClient_' + Math.random().toString(16).substr(2, 8),
            username: 'testing',
            password: 'Testing123',
            clean: true,
          };
          
          console.log("Attempting to connect to MQTT broker...");
          mqttClient = window.mqtt.connect(broker, options);
          mqttClientRef.current = mqttClient;
          
          mqttClient.on('connect', () => {
            console.log("Connected to MQTT broker!");
            setConnectionStatus('✅ Connected to MQTT Broker');
            
            // Subscribe to topics
            mqttClient.subscribe('sensor/temperature');
            [
              'sensor/tegangan', 
              'sensor/arus', 
              'sensor/daya', 
              'sensor/kwh', 
              'sensor/pf'
            ].forEach(topic => {
              mqttClient.subscribe(topic);
            });
          });
          
          mqttClient.on('error', (err) => {
            console.error('MQTT Connection Error:', err);
            setConnectionStatus('❌ MQTT Connection Error: ' + err.message);
          });
          
          mqttClient.on('message', (topic, message) => {
            const msg = message.toString();
            const now = new Date().toLocaleTimeString();
            console.log(`MQTT message received on topic ${topic}: ${msg}`);
            
            // Handle different topics
            if (topic === 'sensor/temperature') {
              const suhu = parseFloat(msg);
              setCurrentTemp(suhu);
              
              // Update chart
              if (chartInstanceRef.current) {
                tempData.labels.push(now);
                tempData.datasets[0].data.push(suhu);
                
                // Keep only last 20 data points
                if (tempData.labels.length > 20) {
                  tempData.labels.shift();
                  tempData.datasets[0].data.shift();
                }
                
                chartInstanceRef.current.update();
              }
            }
            
            if (topic === 'sensor/tegangan') setVoltage(msg);
            if (topic === 'sensor/arus') setCurrent(msg);
            if (topic === 'sensor/daya') setPower(msg);
            if (topic === 'sensor/kwh') setKwh(msg);
            if (topic === 'sensor/pf') setPowerFactor(msg);
          });
        } else {
          setConnectionStatus('❌ MQTT library not found');
          console.error('MQTT library not loaded properly');
        }
        
        // Initialize Chart.js
        if (window.Chart && chartCanvasRef.current) {
          const ctx = chartCanvasRef.current.getContext('2d');
          
          chartInstance = new window.Chart(ctx, {
            type: 'line',
            data: tempData,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { 
                  title: { display: true, text: 'Waktu' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#e0e0e0' }
                },
                y: { 
                  title: { display: true, text: 'Suhu (°C)' }, 
                  suggestedMin: 20, 
                  suggestedMax: 40,
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#e0e0e0' }
                }
              },
              plugins: {
                legend: {
                  labels: { color: '#e0e0e0' }
                }
              }
            }
          });
          chartInstanceRef.current = chartInstance;
        } else {
          console.error('Chart.js library not loaded properly or canvas not found');
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setConnectionStatus('❌ Error initializing dashboard: ' + error.message);
      }
    };
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      initializeDashboard();
    }
    
    // Cleanup on unmount
    return () => {
      if (mqttClientRef.current) {
        console.log('Disconnecting MQTT client...');
        mqttClientRef.current.end();
      }
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);
  
  // MQTT control functions
  const toggleLED = (state) => {
    if (mqttClientRef.current) {
      console.log(`Publishing LED state: ${state}`);
      mqttClientRef.current.publish('control/led', state);
    } else {
      console.warn('MQTT client not initialized yet');
      setConnectionStatus('⚠️ MQTT client not ready, try again in a moment');
    }
  };
  
  const sendText = () => {
    if (mqttClientRef.current && customText.trim() !== '') {
      console.log(`Publishing text: ${customText}`);
      mqttClientRef.current.publish('control/tulisan', customText);
      setCustomText('');
    } else if (!mqttClientRef.current) {
      console.warn('MQTT client not initialized yet');
      setConnectionStatus('⚠️ MQTT client not ready, try again in a moment');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendText();
    }
  };
  
  // UI rendering
  return (
    <div className="flex flex-col h-full overflow-auto bg-[#121212] text-[#e0e0e0] p-4">
      <h2 className="text-center text-xl font-semibold text-[#03dac6] mb-4">MQTT Dashboard - Dark Mode</h2>
      <p className="text-center italic mb-5">{connectionStatus}</p>
      
      {/* Temperature Chart */}
      <div className="bg-[#1f1f1f] rounded-lg p-3 mb-5 h-64">
        <canvas ref={chartCanvasRef} />
      </div>
      
      <p className="text-center mb-4">
        Current Temperature: <span className="font-bold">{currentTemp}</span> °C
      </p>
      
      <h3 className="text-center text-lg font-semibold text-[#03dac6] mb-4">Data Energy Meter</h3>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 items-center">
        <button 
          className="bg-[#00c853] hover:bg-[#00b248] text-white px-5 py-2 rounded-md transition-colors"
          onClick={() => toggleLED('1')}
        >
          Nyalakan LED
        </button>
        <button 
          className="bg-[#d50000] hover:bg-[#b71c1c] text-white px-5 py-2 rounded-md transition-colors"
          onClick={() => toggleLED('0')}
        >
          Matikan LED
        </button>
        <input 
          type="text" 
          placeholder="Tulis pesan..." 
          className="px-3 py-2 rounded-md bg-[#1e1e1e] text-white border-none flex-1 min-w-[150px]"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="bg-[#2196f3] hover:bg-[#1976d2] text-white px-5 py-2 rounded-md transition-colors"
          onClick={sendText}
        >
          Kirim
        </button>
      </div>
      
      {/* Energy Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#2196f3] p-4 rounded-lg shadow-lg text-center">
          <h4 className="mb-2 font-medium">Tegangan</h4>
          <div className="text-2xl font-bold">{voltage} V</div>
        </div>
        <div className="bg-[#4caf50] p-4 rounded-lg shadow-lg text-center">
          <h4 className="mb-2 font-medium">Arus</h4>
          <div className="text-2xl font-bold">{current} A</div>
        </div>
        <div className="bg-[#ffeb3b] p-4 rounded-lg shadow-lg text-center text-black">
          <h4 className="mb-2 font-medium">Daya</h4>
          <div className="text-2xl font-bold">{power} W</div>
        </div>
        <div className="bg-[#ff9800] p-4 rounded-lg shadow-lg text-center">
          <h4 className="mb-2 font-medium">KWH</h4>
          <div className="text-2xl font-bold">{kwh} kWh</div>
        </div>
        <div className="bg-[#9c27b0] p-4 rounded-lg shadow-lg text-center">
          <h4 className="mb-2 font-medium">Power Factor</h4>
          <div className="text-2xl font-bold">{powerFactor}</div>
        </div>
      </div>
      
      <h3 className="text-center text-lg font-semibold text-[#03dac6] mb-4">Kirim Pesan Manual</h3>
    </div>
  );
};

export default SimpleMQTTDashboardPanel;
