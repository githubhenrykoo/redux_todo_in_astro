import { createSlice, createSelector } from '@reduxjs/toolkit';

// Initial user state matching Authentik user info
const initialState = {
  isAuthenticated: false,
  profile: {
    sub: null,
    email: null,
    email_verified: false,
    name: null,
    given_name: null,
    family_name: null,
    nickname: null,
    preferred_username: null,
    groups: [],
    picture: null,
  },
  session: {
    access_token: null,
    id_token: null,
    token_type: null,
    expires_at: null,
    lastLogin: null,
  },
  preferences: {
    theme: 'system', // system, light, dark
    language: 'en',
  }
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Login action using full Authentik user info
    login: (state, action) => {
      const { 
        profile,  // Authentik user profile
        tokens    // Authentication tokens
      } = action.payload;

      console.log('Login Action Payload:', { profile, tokens });

      // Explicitly set authentication state to true
      state.isAuthenticated = true;

      // Spread Authentik profile information
      state.profile = { 
        ...initialState.profile,
        ...profile 
      };

      // Update session tokens and login time
      state.session = {
        access_token: tokens?.access_token || null,
        id_token: tokens?.id_token || null,
        token_type: tokens?.token_type || null,
        expires_at: tokens?.expires_at || 
          (tokens?.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() 
            : null),
        lastLogin: new Date().toISOString()
      };

      console.log('Updated User State:', state);
    },

    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.profile = initialState.profile;
      state.session = initialState.session;
      state.preferences = initialState.preferences;
    },

    // Update user profile
    updateProfile: (state, action) => {
      state.profile = { 
        ...state.profile, 
        ...action.payload 
      };
    },

    // Update user preferences
    updatePreferences: (state, action) => {
      state.preferences = { 
        ...state.preferences, 
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

export const selectUserEmail = createSelector(
  [(state) => state.user],
  (user) => user.profile.email
);

export const selectEmailVerified = createSelector(
  [(state) => state.user],
  (user) => user.profile.email_verified
);

export const selectUserGroups = createSelector(
  [(state) => state.user],
  (user) => user.profile.groups
);

export const selectUserSession = createSelector(
  [(state) => state.user],
  (user) => user.session
);

export const selectUserPreferences = createSelector(
  [(state) => state.user],
  (user) => user.preferences
);

export const { 
  login, 
  logout, 
  updateProfile, 
  updatePreferences,
  incrementLoginAttempts 
} = userSlice.actions;

export default userSlice.reducer;
