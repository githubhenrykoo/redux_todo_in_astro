import { createSlice, createSelector } from '@reduxjs/toolkit';

// Enum-like constants for layout modes
const LAYOUT_MODES = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  ZEN: 'zen',
  FULLSCREEN: 'fullscreen'
};

const GRID_SYSTEMS = {
  BOOTSTRAP: 12,
  TAILWIND: 16,
  CUSTOM: 24
};

const initialState = {
  // Global Layout Mode
  mode: LAYOUT_MODES.DEFAULT,
  
  // Responsive Grid Configuration
  grid: {
    columns: GRID_SYSTEMS.BOOTSTRAP,
    gap: 16, // px
    padding: {
      mobile: 8,
      desktop: 16
    }
  },
  
  // Sidebar Configuration
  sidebar: {
    width: {
      collapsed: 64,  // px
      expanded: 250   // px
    },
    position: 'left', // 'left' | 'right'
    isCollapsed: false
  },
  
  // Breakpoint Configuration
  breakpoints: {
    xs: 576,   // Extra small devices
    sm: 768,   // Small devices
    md: 992,   // Medium devices
    lg: 1200,  // Large devices
    xl: 1600,  // Extra large devices
    xxl: 1920 // Full HD and above
  },
  
  // Theme-related Layout Settings
  theme: {
    borderRadius: 8,  // px
    boxShadow: {
      light: '0 2px 8px rgba(0, 0, 0, 0.1)',
      dark: '0 2px 8px rgba(255, 255, 255, 0.1)'
    }
  },
  
  // Accessibility and Performance
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium' // 'small' | 'medium' | 'large'
  },
  
  // Performance Optimization
  performance: {
    animationEnabled: true,
    lazyLoadingEnabled: true,
    virtualScrolling: true
  }
};

export const layoutConfigSlice = createSlice({
  name: 'layoutConfig',
  initialState,
  reducers: {
    // Change global layout mode
    setLayoutMode: (state, action) => {
      state.mode = action.payload;
    },
    
    // Toggle sidebar collapse
    toggleSidebar: (state) => {
      state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
    },
    
    // Update grid system
    setGridSystem: (state, action) => {
      state.grid.columns = action.payload;
    },
    
    // Update breakpoints
    setBreakpoints: (state, action) => {
      state.breakpoints = {
        ...state.breakpoints,
        ...action.payload
      };
    },
    
    // Toggle high contrast mode
    toggleHighContrast: (state) => {
      state.accessibility.highContrast = !state.accessibility.highContrast;
    },
    
    // Set reduced motion
    setReducedMotion: (state, action) => {
      state.accessibility.reducedMotion = action.payload;
    },
    
    // Update performance settings
    updatePerformanceSettings: (state, action) => {
      state.performance = {
        ...state.performance,
        ...action.payload
      };
    }
  }
});

// Selectors for efficient state access
export const selectLayoutMode = createSelector(
  [(state) => state.layoutConfig],
  (layoutConfig) => layoutConfig.mode
);

export const selectSidebarState = createSelector(
  [(state) => state.layoutConfig],
  (layoutConfig) => layoutConfig.sidebar
);

export const selectBreakpoints = createSelector(
  [(state) => state.layoutConfig],
  (layoutConfig) => layoutConfig.breakpoints
);

export const selectAccessibilitySettings = createSelector(
  [(state) => state.layoutConfig],
  (layoutConfig) => layoutConfig.accessibility
);

// Export actions and constants
export const { 
  setLayoutMode, 
  toggleSidebar, 
  setGridSystem,
  setBreakpoints,
  toggleHighContrast,
  setReducedMotion,
  updatePerformanceSettings
} = layoutConfigSlice.actions;

export { LAYOUT_MODES, GRID_SYSTEMS };

export default layoutConfigSlice.reducer;
