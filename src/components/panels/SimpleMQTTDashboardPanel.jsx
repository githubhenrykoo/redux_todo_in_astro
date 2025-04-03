'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setConnectionStatus,
  setCurrentTemp,
  setVoltage,
  setCurrent,
  setPower,
  setKwh,
  setPowerFactor,
  addTemperatureDataPoint,
  setLedStatus,
  setLastMessage,
  addPublishedMessage
} from '../../store/mqttSlice';

// Import components
import PublishedMessages from '../PublishedMessages';

/**
 * Simple MQTT Dashboard Panel that uses the browser's window object to load MQTT
 * and avoids issues with server-side rendering
 */
const SimpleMQTTDashboardPanel = () => {
  // Local state for input field and temperature
  const [customText, setCustomText] = useState('');
  const [localTemp, setLocalTemp] = useState('--');
  
  // Get Redux dispatch function
  const dispatch = useDispatch();
  
  // Get MQTT state from Redux with fallback values
  const mqttState = useSelector(state => state.mqtt) || {};
  
  // Access currentTemp directly to ensure we get the latest value
  const currentTemp = useSelector(state => state.mqtt?.currentTemp) || '--';
  
  const {
    connectionStatus = 'Waiting for MQTT library...',
    voltage = '--',
    current = '--',
    power = '--',
    kwh = '--',
    powerFactor = '--',
    temperatureHistory = { labels: [], data: [] },
    ledStatus = 'off'
  } = mqttState;
  
  // Load saved state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('mqttDashboardState');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          
          // Dispatch actions to restore state
          if (parsedState.currentTemp) dispatch(setCurrentTemp(parsedState.currentTemp));
          if (parsedState.voltage) dispatch(setVoltage(parsedState.voltage));
          if (parsedState.current) dispatch(setCurrent(parsedState.current));
          if (parsedState.power) dispatch(setPower(parsedState.power));
          if (parsedState.kwh) dispatch(setKwh(parsedState.kwh));
          if (parsedState.powerFactor) dispatch(setPowerFactor(parsedState.powerFactor));
          if (parsedState.ledStatus) dispatch(setLedStatus(parsedState.ledStatus));
          
          // Restore temperature history if available
          if (parsedState.temperatureHistory && 
              parsedState.temperatureHistory.labels && 
              parsedState.temperatureHistory.data) {
            
            // Add each data point individually to ensure chart updates correctly
            parsedState.temperatureHistory.labels.forEach((label, index) => {
              dispatch(addTemperatureDataPoint({
                label,
                value: parsedState.temperatureHistory.data[index]
              }));
            });
          }
          
          console.log('Loaded saved state from localStorage:', parsedState);
        } catch (error) {
          console.error('Error loading saved state:', error);
        }
      }
    }
  }, [dispatch]);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(mqttState).length > 0) {
      // Create a simplified version of the state to save
      const stateToSave = {
        currentTemp: mqttState.currentTemp,
        voltage: mqttState.voltage,
        current: mqttState.current,
        power: mqttState.power,
        kwh: mqttState.kwh,
        powerFactor: mqttState.powerFactor,
        temperatureHistory: mqttState.temperatureHistory,
        ledStatus: mqttState.ledStatus
      };
      
      localStorage.setItem('mqttDashboardState', JSON.stringify(stateToSave));
      console.log('Saved state to localStorage');
    }
  }, [mqttState]);
  
  // Add more detailed debug log
  useEffect(() => {
    console.log('Current temperature from Redux:', currentTemp);
    console.log('Full MQTT state:', mqttState);
  }, [currentTemp, mqttState]);
  
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
    
    const initializeDashboard = async () => {
      try {
        // Load required scripts
        dispatch(setConnectionStatus('Loading required libraries...'));
        await Promise.all([
          loadScript('https://unpkg.com/mqtt/dist/mqtt.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/chart.js')
        ]);
        dispatch(setConnectionStatus('Libraries loaded, connecting to broker...'));
        
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
            dispatch(setConnectionStatus('✅ Connected to MQTT Broker'));
            
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
            dispatch(setConnectionStatus('❌ MQTT Connection Error: ' + err.message));
          });
          
          mqttClient.on('message', (topic, message) => {
            const msg = message.toString();
            const now = new Date().toLocaleTimeString();
            console.log(`MQTT message received on topic ${topic}: ${msg}`);
            
            // Store last message in Redux
            dispatch(setLastMessage({ topic, message: msg }));
            
            // Handle different topics
            if (topic === 'sensor/temperature') {
              try {
                const suhu = parseFloat(msg);
                if (!isNaN(suhu)) {
                  console.log(`Updating temperature to: ${suhu}°C`);
                  
                  // Update Redux state
                  dispatch(setCurrentTemp(suhu));
                  
                  // Also update local state for immediate UI update
                  setLocalTemp(suhu);
                  
                  // Force component update with local state
                  setCustomText(prev => prev); // This is a trick to force re-render
                  
                  // Add temperature data point to history
                  dispatch(addTemperatureDataPoint({ label: now, value: suhu }));
                  
                  // Directly update chart with new data point
                  if (chartInstanceRef.current) {
                    // Limit chart to show last 10 data points for better visualization
                    if (chartInstanceRef.current.data.labels.length > 10) {
                      chartInstanceRef.current.data.labels.shift();
                      chartInstanceRef.current.data.datasets[0].data.shift();
                    }
                    
                    // Add new data point
                    chartInstanceRef.current.data.labels.push(now);
                    chartInstanceRef.current.data.datasets[0].data.push(suhu);
                    chartInstanceRef.current.update('none'); // Use 'none' for smoother updates
                  }
                } else {
                  console.error('Received invalid temperature value:', msg);
                }
              } catch (error) {
                console.error('Error processing temperature data:', error);
              }
            }
            
            // Other sensor topics remain the same
            if (topic === 'sensor/tegangan') dispatch(setVoltage(msg));
            if (topic === 'sensor/arus') dispatch(setCurrent(msg));
            if (topic === 'sensor/daya') dispatch(setPower(msg));
            if (topic === 'sensor/kwh') dispatch(setKwh(msg));
            if (topic === 'sensor/pf') dispatch(setPowerFactor(msg));
          });
        } else {
          dispatch(setConnectionStatus('❌ MQTT library not found'));
          console.error('MQTT library not loaded properly');
        }
        
        // Initialize Chart.js
        if (window.Chart && chartCanvasRef.current) {
          const ctx = chartCanvasRef.current.getContext('2d');
          
          chartInstance = new window.Chart(ctx, {
            type: 'line',
            data: {
              labels: temperatureHistory.labels,
              datasets: [{
                label: 'Temperature (°C)',
                data: temperatureHistory.data,
                fill: false,
                borderColor: '#03dac5',
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#03dac5'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 500 // Faster animations for real-time data
              },
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
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  titleColor: '#03dac5',
                  bodyColor: '#ffffff',
                  borderColor: '#03dac5',
                  borderWidth: 1,
                  displayColors: false
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
        dispatch(setConnectionStatus('❌ Error initializing dashboard: ' + error.message));
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
  }, [dispatch]);
  
  // Update chart when temperature history changes - only for initial load or when history is reset
  useEffect(() => {
    if (chartInstanceRef.current && mqttState.temperatureHistory) {
      // Only do a full update if the chart is empty but history has data
      if (chartInstanceRef.current.data.labels.length === 0 && mqttState.temperatureHistory.labels.length > 0) {
        chartInstanceRef.current.data.labels = [...mqttState.temperatureHistory.labels];
        chartInstanceRef.current.data.datasets[0].data = [...mqttState.temperatureHistory.data];
        chartInstanceRef.current.update();
      }
    }
  }, [mqttState.temperatureHistory]);
  
  // MQTT control functions
  const toggleLED = (state) => {
    if (mqttClientRef.current) {
      console.log(`Publishing LED state: ${state}`);
      mqttClientRef.current.publish('control/led', state);
      
      // Record the published message in Redux
      dispatch(addPublishedMessage({
        topic: 'control/led',
        message: state,
        timestamp: new Date().toISOString()
      }));
      
      dispatch(setLedStatus(state === '1' ? 'on' : 'off'));
    } else {
      console.warn('MQTT client not initialized yet');
      dispatch(setConnectionStatus('⚠️ MQTT client not ready, try again in a moment'));
    }
  };
  
  const sendText = () => {
    if (mqttClientRef.current && customText.trim() !== '') {
      console.log(`Publishing text: ${customText}`);
      mqttClientRef.current.publish('control/tulisan', customText);
      
      // Record the published message in Redux
      dispatch(addPublishedMessage({
        topic: 'control/tulisan',
        message: customText,
        timestamp: new Date().toISOString()
      }));
      
      setCustomText('');
    } else if (!mqttClientRef.current) {
      console.warn('MQTT client not initialized yet');
      dispatch(setConnectionStatus('⚠️ MQTT client not ready, try again in a moment'));
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
        Current Temperature: 
        <span className="font-bold text-2xl ml-2 text-[#03dac6]">
          {localTemp !== '--' ? `${localTemp}°C` : (currentTemp && currentTemp !== '--' ? `${currentTemp}°C` : '--')}
        </span>
      </p>
      
      <h3 className="text-center text-lg font-semibold text-[#03dac6] mb-4">Data Energy Meter</h3>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 items-center">
        <button 
          className="bg-[#00c853] hover:bg-[#00b248] text-white px-5 py-2 rounded-md transition-colors"
          onClick={() => toggleLED('1')}
        >
          On LED
        </button>
        <button 
          className="bg-[#d50000] hover:bg-[#b71c1c] text-white px-5 py-2 rounded-md transition-colors"
          onClick={() => toggleLED('0')}
        >
          Off LED
        </button>
      </div>
      
      {/* Energy Meter Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1f1f1f] p-4 rounded-lg text-center">
          <h4 className="text-[#bb86fc] mb-2">Voltage</h4>
          <p className="text-2xl font-bold">{voltage} <span className="text-sm">V</span></p>
        </div>
        <div className="bg-[#1f1f1f] p-4 rounded-lg text-center">
          <h4 className="text-[#bb86fc] mb-2">Current</h4>
          <p className="text-2xl font-bold">{current} <span className="text-sm">A</span></p>
        </div>
        <div className="bg-[#1f1f1f] p-4 rounded-lg text-center">
          <h4 className="text-[#bb86fc] mb-2">Power</h4>
          <p className="text-2xl font-bold">{power} <span className="text-sm">W</span></p>
        </div>
        <div className="bg-[#1f1f1f] p-4 rounded-lg text-center">
          <h4 className="text-[#bb86fc] mb-2">Energy</h4>
          <p className="text-2xl font-bold">{kwh} <span className="text-sm">kWh</span></p>
        </div>
        <div className="bg-[#1f1f1f] p-4 rounded-lg text-center">
          <h4 className="text-[#bb86fc] mb-2">Power Factor</h4>
          <p className="text-2xl font-bold">{powerFactor}</p>
        </div>
      </div>
      
      <h3 className="text-center text-lg font-semibold text-[#03dac6] mb-4">Send Message</h3>
      
      {/* Text Input */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your message here..."
          className="flex-grow bg-[#2d2d2d] text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#03dac6]"
        />
        <button
          onClick={sendText}
          className="bg-[#03dac6] hover:bg-[#018786] text-black font-medium px-6 py-2 rounded-md transition-colors"
        >
          Send
        </button>
      </div>
      
      {/* Published Messages */}
      <PublishedMessages />
    </div>
  );
};

export default SimpleMQTTDashboardPanel;
