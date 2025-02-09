import { jest } from '@jest/globals';
import reducer, { changeLayout } from '../features/panellayoutSlice';
import layoutConfig from '../features/panellayoutSlice.json';

describe('panellayoutSlice', () => {
  const initialState = {
    panels: layoutConfig['todo_layout']
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should change layout successfully', () => {
    const previousState = initialState;
    const newLayoutName = 'generate_layout';
    
    // Ensure the layout exists in config
    expect(layoutConfig[newLayoutName]).toBeDefined();

    const action = changeLayout(newLayoutName);
    const nextState = reducer(previousState, action);

    expect(nextState.panels).toEqual(layoutConfig[newLayoutName]);
  });

  it('should handle changing to an invalid layout', () => {
    const previousState = initialState;
    const invalidLayoutName = 'non_existent_layout';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const action = changeLayout(invalidLayoutName);
    const nextState = reducer(previousState, action);

    expect(nextState.panels).toEqual(previousState.panels);
    expect(consoleSpy).toHaveBeenCalledWith(`Layout ${invalidLayoutName} not found`);

    consoleSpy.mockRestore();
  });
});
