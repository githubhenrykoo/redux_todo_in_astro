import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Async thunk for checking tRPC connection
export const checkTRPCConnection = createAsyncThunk(
  'network/checkTRPCConnection',
  async (_, { rejectWithValue }) => {
    try {
      // Placeholder for actual tRPC health check
      const response = await fetch('/api/trpc/health');
      if (!response.ok) {
        throw new Error('tRPC connection failed');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for P2P network discovery
export const discoverP2PNodes = createAsyncThunk(
  'network/discoverP2PNodes',
  async (_, { rejectWithValue }) => {
    try {
      // Placeholder for P2P node discovery logic
      // In a real implementation, this would use libp2p or similar
      const nodes = await Promise.resolve([
        // Simulated node discovery
        { id: 'node1', address: '/ip4/127.0.0.1/tcp/4001' },
        { id: 'node2', address: '/ip4/192.168.1.100/tcp/4001' }
      ]);
      return nodes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  trpc: {
    status: 'idle', // 'idle' | 'connecting' | 'connected' | 'disconnected'
    endpoint: '/api/trpc',
    lastConnection: null,
    error: null
  },
  p2p: {
    isEnabled: false,
    status: 'idle', // 'idle' | 'discovering' | 'connected'
    peerId: null,
    connectedPeers: [],
    discoveredNodes: [],
    error: null
  },
  connectivity: {
    isOnline: navigator.onLine,
    connectionType: navigator.connection?.effectiveType || 'unknown'
  }
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    // Update online/offline status
    updateConnectivityStatus: (state) => {
      state.connectivity.isOnline = navigator.onLine;
      state.connectivity.connectionType = navigator.connection?.effectiveType || 'unknown';
    },

    // Toggle P2P network
    toggleP2PNetwork: (state, action) => {
      state.p2p.isEnabled = action.payload;
    },

    // Manual network reset
    resetNetwork: () => initialState
  },
  extraReducers: (builder) => {
    // tRPC Connection Handling
    builder
      .addCase(checkTRPCConnection.pending, (state) => {
        state.trpc.status = 'connecting';
      })
      .addCase(checkTRPCConnection.fulfilled, (state, action) => {
        state.trpc.status = 'connected';
        state.trpc.lastConnection = new Date().toISOString();
        state.trpc.error = null;
      })
      .addCase(checkTRPCConnection.rejected, (state, action) => {
        state.trpc.status = 'disconnected';
        state.trpc.error = action.payload;
      })
      
    // P2P Node Discovery
    builder
      .addCase(discoverP2PNodes.pending, (state) => {
        state.p2p.status = 'discovering';
      })
      .addCase(discoverP2PNodes.fulfilled, (state, action) => {
        state.p2p.status = 'connected';
        state.p2p.discoveredNodes = action.payload;
        state.p2p.connectedPeers = action.payload.map(node => node.id);
        state.p2p.error = null;
      })
      .addCase(discoverP2PNodes.rejected, (state, action) => {
        state.p2p.status = 'idle';
        state.p2p.error = action.payload;
      });
  }
});

// Selectors
export const selectNetworkStatus = createSelector(
  [(state) => state.network],
  (network) => ({
    trpc: network.trpc.status,
    p2p: network.p2p.status,
    connectivity: network.connectivity
  })
);

export const selectP2PNodes = createSelector(
  [(state) => state.network],
  (network) => network.p2p.discoveredNodes
);

export const { 
  updateConnectivityStatus, 
  toggleP2PNetwork, 
  resetNetwork 
} = networkSlice.actions;

export default networkSlice.reducer;
