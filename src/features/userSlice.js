import { createSlice, createSelector } from '@reduxjs/toolkit';

// Initial user state
const initialState = {
  isAuthenticated: false,
  profile: {
    id: null,
    username: null,
    email: null,
    avatar: null,
  },
  preferences: {
    language: 'en',
    notifications: {
      email: true,
      push: false,
    },
    theme: 'system', // system, light, dark
  },
  session: {
    token: null,
    lastLogin: null,
    loginAttempts: 0,
  },
  permissions: {
    roles: [],
    capabilities: [],
  }
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Login action
    login: (state, action) => {
      const { profile, token } = action.payload;
      state.isAuthenticated = true;
      state.profile = { ...state.profile, ...profile };
      state.session.token = token;
      state.session.lastLogin = new Date().toISOString();
      state.session.loginAttempts = 0;
    },

    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.profile = initialState.profile;
      state.session.token = null;
      state.session.lastLogin = null;
    },

    // Update user profile
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },

    // Update user preferences
    updatePreferences: (state, action) => {
      state.preferences = { 
        ...state.preferences, 
        ...action.payload 
      };
    },

    // Update user permissions
    updatePermissions: (state, action) => {
      state.permissions = {
        ...state.permissions,
        ...action.payload
      };
    },

    // Increment login attempts
    incrementLoginAttempts: (state) => {
      state.session.loginAttempts += 1;
    }
  }
});

// Selectors
export const selectIsAuthenticated = createSelector(
  [(state) => state.user],
  (user) => user.isAuthenticated
);

export const selectUserProfile = createSelector(
  [(state) => state.user],
  (user) => user.profile
);

export const selectUserPreferences = createSelector(
  [(state) => state.user],
  (user) => user.preferences
);

export const selectUserPermissions = createSelector(
  [(state) => state.user],
  (user) => user.permissions
);

export const { 
  login, 
  logout, 
  updateProfile, 
  updatePreferences,
  updatePermissions,
  incrementLoginAttempts 
} = userSlice.actions;

export default userSlice.reducer;
