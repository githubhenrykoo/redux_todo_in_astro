import { jest } from '@jest/globals';
import reducer, { 
  recordAction,
  logError,
  startOperation,
  updateOperationProgress,
  completeOperation,
  updateSystemStatus,
  clearActionHistory,
  clearErrorHistory
} from '../features/systemSlice';

describe('systemSlice', () => {
  const initialState = {
    actionHistory: [],
    errors: [],
    operations: {},
    systemStatus: {
      isOnline: true,
      lastChecked: expect.any(Number)
    }
  };

  it('should return the initial state', () => {
    const state = reducer(undefined, { type: 'unknown' });
    expect(state.actionHistory).toEqual([]);
    expect(state.errors).toEqual([]);
    expect(state.operations).toEqual({});
    expect(state.systemStatus.isOnline).toBe(true);
  });

  it('should record an action', () => {
    const action = recordAction('user/login', { username: 'test' });
    const nextState = reducer(initialState, action);
    
    expect(nextState.actionHistory).toHaveLength(1);
    expect(nextState.actionHistory[0].type).toBe('user/login');
    expect(nextState.actionHistory[0].payload).toEqual({ username: 'test' });
    expect(nextState.actionHistory[0].id).toBeTruthy();
    expect(nextState.actionHistory[0].timestamp).toBeTruthy();
  });

  it('should limit action history to 100 entries', () => {
    let state = initialState;
    for (let i = 0; i < 150; i++) {
      state = reducer(state, recordAction(`action/${i}`, { index: i }));
    }
    
    expect(state.actionHistory).toHaveLength(100);
    expect(state.actionHistory[0].payload.index).toBe(50);
  });

  it('should log an error', () => {
    const action = logError('Test error', 'warning');
    const nextState = reducer(initialState, action);
    
    expect(nextState.errors).toHaveLength(1);
    expect(nextState.errors[0].message).toBe('Test error');
    expect(nextState.errors[0].severity).toBe('warning');
    expect(nextState.errors[0].id).toBeTruthy();
    expect(nextState.errors[0].timestamp).toBeTruthy();
  });

  it('should start an operation', () => {
    const action = startOperation('data/fetch');
    const nextState = reducer(initialState, action);
    
    const operationId = Object.keys(nextState.operations)[0];
    expect(nextState.operations[operationId]).toEqual({
      id: operationId,
      name: 'data/fetch',
      status: 'pending',
      startTime: expect.any(Number),
      progress: 0
    });
  });

  it('should update operation progress', () => {
    const startAction = startOperation('data/fetch');
    let state = reducer(initialState, startAction);
    
    const operationId = Object.keys(state.operations)[0];
    const progressAction = updateOperationProgress({ 
      id: operationId, 
      progress: 50,
      status: 'loading' 
    });
    
    state = reducer(state, progressAction);
    
    expect(state.operations[operationId].progress).toBe(50);
    expect(state.operations[operationId].status).toBe('loading');
  });

  it('should complete an operation', () => {
    const startAction = startOperation('data/fetch');
    let state = reducer(initialState, startAction);
    
    const operationId = Object.keys(state.operations)[0];
    const completeAction = completeOperation({ 
      id: operationId, 
      status: 'success' 
    });
    
    state = reducer(state, completeAction);
    
    expect(state.operations[operationId].status).toBe('success');
    expect(state.operations[operationId].endTime).toBeTruthy();
  });

  it('should update system status', () => {
    const action = updateSystemStatus({ isOnline: false });
    const nextState = reducer(initialState, action);
    
    expect(nextState.systemStatus.isOnline).toBe(false);
    expect(nextState.systemStatus.lastChecked).not.toBe(initialState.systemStatus.lastChecked);
  });

  it('should clear action history', () => {
    let state = initialState;
    for (let i = 0; i < 10; i++) {
      state = reducer(state, recordAction(`action/${i}`, { index: i }));
    }
    
    const clearAction = clearActionHistory();
    const nextState = reducer(state, clearAction);
    
    expect(nextState.actionHistory).toHaveLength(0);
  });

  it('should clear error history', () => {
    let state = initialState;
    for (let i = 0; i < 10; i++) {
      state = reducer(state, logError(`Error ${i}`, 'error'));
    }
    
    const clearAction = clearErrorHistory();
    const nextState = reducer(state, clearAction);
    
    expect(nextState.errors).toHaveLength(0);
  });
});
