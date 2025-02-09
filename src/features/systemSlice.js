import { createSlice, nanoid } from '@reduxjs/toolkit';
import { z } from 'zod';

// Action History Entry Schema
const ActionEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  payload: z.any().optional(),
  meta: z.object({
    source: z.string().optional(),
    traceId: z.string().optional()
  }).optional()
});

// System Error Schema
const SystemErrorSchema = z.object({
  id: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  timestamp: z.number(),
  context: z.record(z.string(), z.any()).optional()
});

// Operation Status Schema
const OperationStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['idle', 'pending', 'success', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  startTime: z.number(),
  endTime: z.number().optional(),
  error: SystemErrorSchema.optional()
});

// Initial State
const initialState = {
  actionHistory: [],
  errors: [],
  operations: {},
  systemStatus: {
    isOnline: navigator?.onLine ?? true,
    lastChecked: Date.now()
  }
};

// System Slice
const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    // Record Action History
    recordAction: {
      reducer: (state, action) => {
        // Limit action history to last 100 entries
        if (state.actionHistory.length >= 100) {
          state.actionHistory.shift();
        }
        state.actionHistory.push(action.payload);
      },
      prepare: (type, payload, meta = {}) => ({
        payload: {
          id: nanoid(),
          type,
          payload,
          timestamp: Date.now(),
          meta: {
            source: meta.source || 'user',
            traceId: meta.traceId || nanoid()
          }
        }
      })
    },

    // Log System Error
    logError: {
      reducer: (state, action) => {
        // Limit error history to last 50 entries
        if (state.errors.length >= 50) {
          state.errors.shift();
        }
        state.errors.push(action.payload);
      },
      prepare: (message, severity = 'error', context = {}) => ({
        payload: {
          id: nanoid(),
          message,
          severity,
          timestamp: Date.now(),
          context
        }
      })
    },

    // Manage Operation Status
    startOperation: {
      reducer: (state, action) => {
        const { id, name } = action.payload;
        state.operations[id] = {
          id,
          name,
          status: 'pending',
          startTime: Date.now(),
          progress: 0
        };
      },
      prepare: (name) => ({
        payload: {
          id: nanoid(),
          name
        }
      })
    },

    // Update Operation Progress
    updateOperationProgress: (state, action) => {
      const { id, progress, status } = action.payload;
      if (state.operations[id]) {
        state.operations[id].progress = progress;
        if (status) state.operations[id].status = status;
      }
    },

    // Complete Operation
    completeOperation: (state, action) => {
      const { id, status = 'success', error } = action.payload;
      if (state.operations[id]) {
        state.operations[id].status = status;
        state.operations[id].endTime = Date.now();
        if (error) {
          state.operations[id].error = error;
          // Also log the error
          systemSlice.caseReducers.logError(state, {
            payload: {
              message: error.message,
              severity: 'error',
              context: { operationId: id }
            }
          });
        }
      }
    },

    // Update System Online Status
    updateSystemStatus: (state, action) => {
      state.systemStatus = {
        ...state.systemStatus,
        ...action.payload,
        lastChecked: Date.now()
      };
    },

    // Clear Action History
    clearActionHistory: (state) => {
      state.actionHistory = [];
    },

    // Clear Error History
    clearErrorHistory: (state) => {
      state.errors = [];
    }
  }
});

export const {
  recordAction,
  logError,
  startOperation,
  updateOperationProgress,
  completeOperation,
  updateSystemStatus,
  clearActionHistory,
  clearErrorHistory
} = systemSlice.actions;

export default systemSlice.reducer;

// Utility function for tracking async operations
export const trackAsyncOperation = (asyncFn, operationName) => 
  async (dispatch, ...args) => {
    const operationId = nanoid();
    try {
      // Start the operation
      dispatch(startOperation(operationName));

      // Record the action
      dispatch(recordAction(`${operationName}/start`));

      // Call the async function
      const result = await asyncFn(dispatch, ...args);

      // Complete the operation
      dispatch(completeOperation({ 
        id: operationId, 
        status: 'success' 
      }));

      // Record successful completion
      dispatch(recordAction(`${operationName}/success`));

      return result;
    } catch (error) {
      // Handle and log errors
      dispatch(completeOperation({ 
        id: operationId, 
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack
        }
      }));

      // Record error action
      dispatch(recordAction(`${operationName}/failed`, error));

      // Rethrow or handle as needed
      throw error;
    }
  };
