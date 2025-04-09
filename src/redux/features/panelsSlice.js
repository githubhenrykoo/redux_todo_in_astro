import { createSlice } from '@reduxjs/toolkit';

const panelsSlice = createSlice({
    name: 'panels',
    initialState: {
        activePanel: null,
        panels: []
    },
    reducers: {
        setActivePanel: (state, action) => {
            state.activePanel = action.payload;
        },
        setPanels: (state, action) => {
            state.panels = action.payload;
        }
    }
});

export const { setActivePanel, setPanels } = panelsSlice.actions;
export default panelsSlice.reducer;