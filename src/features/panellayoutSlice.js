import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

// Layout modes for different interfaces
export const LAYOUT_MODES = ['todo_layout', 'question_layout', 'note_layout'];

// Panel types
export const PANEL_TYPES = {
    SEARCH_TODOS: 'SearchAndTodos',
    ITEM_DETAIL: 'ItemDetailPanel',
    ACTION_LOG: 'ActionLogPanel'
};

const initialState = {
    mode: 'todo_layout',
    // Panel configuration
    panels: {
        left: {
            type: PANEL_TYPES.SEARCH_TODOS,
            size: 30,
            minSize: 20,
            visible: true
        },
        middle: {
            type: PANEL_TYPES.ITEM_DETAIL,
            size: 40,
            minSize: 20,
            visible: true
        },
        right: {
            type: PANEL_TYPES.ACTION_LOG,
            size: 30,
            minSize: 20,
            visible: true
        }
    },
    // Common UI preferences
    showLineNumbers: true,
    showStatusBar: true,
    wrapText: true
};

const panelLayoutSlice = createSlice({
    name: 'panelLayout',
    initialState,
    reducers: {
        setMode: (state, action) => {
            if (LAYOUT_MODES.includes(action.payload)) {
                state.mode = action.payload;
            }
        },
        setPanelSize: (state, action) => {
            const { panel, size } = action.payload;
            if (['left', 'middle', 'right'].includes(panel)) {
                state.panels[panel].size = size;
            }
        },
        togglePanelVisibility: (state, action) => {
            const panel = action.payload;
            if (['left', 'middle', 'right'].includes(panel)) {
                state.panels[panel].visible = !state.panels[panel].visible;
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
        resetLayout: (state) => {
            return initialState;
        }
    }
});

// Actions
export const {
    setMode,
    setPanelSize,
    togglePanelVisibility,
    toggleLineNumbers,
    toggleStatusBar,
    toggleWrapText,
    resetLayout
} = panelLayoutSlice.actions;

// Selectors
export const selectMode = state => state.panelLayout.mode;
export const selectIsTodoLayout = state => state.panelLayout.mode === LAYOUT_MODES[0];
export const selectIsQuestionLayout = state => state.panelLayout.mode === LAYOUT_MODES[1];
export const selectIsNoteLayout = state => state.panelLayout.mode === LAYOUT_MODES[2];

export const selectPanelConfiguration = createSelector(
    state => state.panelLayout.panels,
    panels => panels
);

export const selectPanelSizes = createSelector(
    state => state.panelLayout.panels,
    panels => ({
        leftPanelSize: panels.left.size,
        middlePanelSize: panels.middle.size,
        rightPanelSize: panels.right.size
    })
);

export const selectPanelVisibility = createSelector(
    state => state.panelLayout.panels,
    panels => ({
        leftPanelVisible: panels.left.visible,
        middlePanelVisible: panels.middle.visible,
        rightPanelVisible: panels.right.visible
    })
);

export const selectEditorPreferences = createSelector(
    state => state.panelLayout,
    layout => ({
        showLineNumbers: layout.showLineNumbers,
        showStatusBar: layout.showStatusBar,
        wrapText: layout.wrapText
    })
);

export default panelLayoutSlice.reducer;