import React from 'react';
import { useSelector } from 'react-redux';

const MQTTDebugPanel = () => {
  const mqttState = useSelector(state => state.mqtt) || {};
  
  return (
    <div className="bg-[#1f1f1f] p-4 rounded-lg mt-4">
      <h3 className="text-[#bb86fc] mb-2 font-semibold">MQTT Debug Info</h3>
      <div className="text-xs font-mono overflow-auto max-h-40">
        <p>Connection: {mqttState.connectionStatus}</p>
        <p>Temperature: {mqttState.currentTemp}</p>
        <p>Last Message: {mqttState.lastMessage} (Topic: {mqttState.lastMessageTopic})</p>
        <p>Temperature History Points: {mqttState.temperatureHistory?.data?.length || 0}</p>
      </div>
    </div>
  );
};

export default MQTTDebugPanel;