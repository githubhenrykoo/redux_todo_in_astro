import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentTemp } from '../store/mqttSlice';

const MQTTStateTest = () => {
  const dispatch = useDispatch();
  const mqttState = useSelector(state => state.mqtt);
  
  const testRedux = () => {
    // Test dispatching an action to update temperature
    dispatch(setCurrentTemp(Math.floor(Math.random() * 30) + 20)); // Random temp between 20-50
    console.log('MQTT state updated via Redux');
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-white font-medium mb-2">MQTT Redux State Test</h3>
      <div className="mb-2">
        <p className="text-gray-300">Current Temperature: <span className="font-bold text-white">{mqttState?.currentTemp || '--'}</span></p>
        <p className="text-gray-300">Connection Status: <span className="font-bold text-white">{mqttState?.connectionStatus || '--'}</span></p>
      </div>
      <button 
        onClick={testRedux}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Test Redux Update
      </button>
    </div>
  );
};

export default MQTTStateTest;