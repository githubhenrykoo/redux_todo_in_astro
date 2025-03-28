import { jsxDEV } from 'react/jsx-dev-runtime';
import { useReducer, createContext } from 'react';

const initialState = {
  leftWidth: 250,
  rightWidth: 300
};
const PanelContext = createContext({
  state: initialState,
  dispatch: () => null
});
function panelReducer(state, action) {
  switch (action.type) {
    case "RESIZE_LEFT":
      return { ...state, leftWidth: action.width };
    case "RESIZE_RIGHT":
      return { ...state, rightWidth: action.width };
    default:
      return state;
  }
}
function PanelController({ children }) {
  const [state, dispatch] = useReducer(panelReducer, initialState);
  return /* @__PURE__ */ jsxDEV(PanelContext.Provider, { value: { state, dispatch }, children }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/PanelSystem.tsx",
    lineNumber: 45,
    columnNumber: 5
  }, this);
}

export { PanelController };
