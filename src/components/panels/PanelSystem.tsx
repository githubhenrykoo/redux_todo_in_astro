import React, { createContext, useContext, useReducer } from 'react';

interface PanelState {
  leftWidth: number;
  rightWidth: number;
}

interface PanelAction {
  type: 'RESIZE_LEFT' | 'RESIZE_RIGHT';
  width: number;
}

const initialState: PanelState = {
  leftWidth: 250,
  rightWidth: 300
};

const PanelContext = createContext<{
  state: PanelState;
  dispatch: React.Dispatch<PanelAction>;
}>({
  state: initialState,
  dispatch: () => null
});

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'RESIZE_LEFT':
      return { ...state, leftWidth: action.width };
    case 'RESIZE_RIGHT':
      return { ...state, rightWidth: action.width };
    default:
      return state;
  }
}

interface PanelSystemProps {
  children: React.ReactNode;
}

export function PanelController({ children }: PanelSystemProps) {
  const [state, dispatch] = useReducer(panelReducer, initialState);

  return (
    <PanelContext.Provider value={{ state, dispatch }}>
      {children}
    </PanelContext.Provider>
  );
}
