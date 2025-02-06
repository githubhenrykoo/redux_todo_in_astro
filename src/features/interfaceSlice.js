import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

// Interface modes
export const INTERFACE_MODES = ['todo_interface', 'question_interface', 'rag_interface'];

const initialState = {
    mode: 'todo_interface',
    // Panel sizes (in percentage)
    leftPanelSize: 30,
    middlePanelSize: 40,
    rightPanelSize: 30,
    // Common UI preferences
    showLineNumbers: true,
    showStatusBar: true,
    wrapText: true
};

const interfaceSlice = createSlice({
    name: 'interface',
    initialState,
    reducers: {
        setMode: (state, action) => {
            if (INTERFACE_MODES.includes(action.payload)) {
                state.mode = action.payload;
            }
        },
        setPanelSize: (state, action) => {
            const { panel, size } = action.payload;
            if (['left', 'middle', 'right'].includes(panel)) {
                state[`${panel}PanelSize`] = size;
            }
        },
        toggleLineNumbers: (state) => {
            state.showLineNumbers = !state.showLineNumbers;
        },
        toggleStatusBar: (state) => {
            state.showStatusBar = !state.showStatusBar;
        },
        toggleWrapText: (state) => {
            state.wrapText = !state.wrapText;
        },
        resetInterface: (state) => {
            return initialState;
        }
    }
});

// Actions
export const {
    setMode,
    setPanelSize,
    toggleLineNumbers,
    toggleStatusBar,
    toggleWrapText,
    resetInterface
} = interfaceSlice.actions;

// Selectors
export const selectMode = state => state.interface.mode;
export const selectIsTodoMode = state => state.interface.mode === INTERFACE_MODES[0];
export const selectIsQuestionMode = state => state.interface.mode === INTERFACE_MODES[1];
export const selectIsRagMode = state => state.interface.mode === INTERFACE_MODES[2];

export const selectPanelSizes = createSelector(
    state => state.interface,
    uiState => ({
        leftPanelSize: uiState.leftPanelSize,
        middlePanelSize: uiState.middlePanelSize,
        rightPanelSize: uiState.rightPanelSize
    })
);

export const selectEditorPreferences = createSelector(
    state => state.interface,
    uiState => ({
        showLineNumbers: uiState.showLineNumbers,
        showStatusBar: uiState.showStatusBar,
        wrapText: uiState.wrapText
    })
);

export default interfaceSlice.reducer;