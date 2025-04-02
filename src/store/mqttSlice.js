// Make sure your mqttSlice has all the necessary actions for the MQTT Dashboard Panel
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  connectionStatus: 'Disconnected',
  currentTemp: '--',
  voltage: '--',
  current: '--',
  power: '--',
  kwh: '--',
  powerFactor: '--',
  temperatureHistory: {
    labels: [],
    data: []
  },
  ledStatus: 'off',
  lastMessage: '',
  lastMessageTopic: '',
  publishedMessages: [] // Add this line to include publishedMessages in initial state
};

const mqttSlice = createSlice({
  name: 'mqtt',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload;
    },
    setCurrentTemp: (state, action) => {
      state.currentTemp = action.payload;
    },
    // Make sure all other reducers are defined here
    setVoltage: (state, action) => {
      state.voltage = action.payload;
    },
    setCurrent: (state, action) => {
      state.current = action.payload;
    },
    setPower: (state, action) => {
      state.power = action.payload;
    },
    setKwh: (state, action) => {
      state.kwh = action.payload;
    },
    setPowerFactor: (state, action) => {
      state.powerFactor = action.payload;
    },
    addTemperatureDataPoint: (state, action) => {
      const { label, value } = action.payload;
      state.temperatureHistory.labels.push(label);
      state.temperatureHistory.data.push(value);
      
      // Keep only last 20 data points
      if (state.temperatureHistory.labels.length > 20) {
        state.temperatureHistory.labels.shift();
        state.temperatureHistory.data.shift();
      }
    },
    setLedStatus: (state, action) => {
      state.ledStatus = action.payload;
    },
    setLastMessage: (state, action) => {
      state.lastMessage = action.payload.message;
      state.lastMessageTopic = action.payload.topic;
    },
    // Make sure this reducer exists
    addPublishedMessage: (state, action) => {
      const { topic, message, timestamp } = action.payload;
      state.publishedMessages.push({ topic, message, timestamp });
      
      // Keep only the last 20 published messages
      if (state.publishedMessages.length > 20) {
        state.publishedMessages.shift();
      }
    },
    resetMqttState: (state) => {
      return initialState;
    }
  }
});

export const {
  setConnectionStatus,
  setCurrentTemp,
  // Export all other actions
  setVoltage,
  setCurrent,
  setPower,
  setKwh,
  setPowerFactor,
  addTemperatureDataPoint,
  setLedStatus,
  setLastMessage,
  addPublishedMessage, // Make sure this is exported
  resetMqttState
} = mqttSlice.actions;

export default mqttSlice.reducer;