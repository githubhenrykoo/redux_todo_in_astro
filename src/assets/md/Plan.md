# Authentik Authentication Implementation Plan

## Overview

This document outlines the implementation plan for integrating Authentik authentication into the Redux Todo in Astro application. We're using a simplified approach with a standalone authentication panel that doesn't rely on Redux for state management.

## ⚠️ Isolation Guarantee

This implementation is designed to be **completely isolated** from the rest of the application:

1. **Page-Specific Authentication**: The authentication only applies to pages where you explicitly add the `AuthentikPanel` component.
2. **No Global State**: Authentication state is stored in localStorage with unique keys rather than in Redux or other global state.
3. **Unique Storage Keys**: Each instance of the authentication panel uses unique storage keys to prevent conflicts.
4. **No Side Effects**: The authentication service doesn't modify any global JavaScript objects or create global event listeners.
5. **Opt-in Only**: Authentication is completely opt-in and won't affect any existing pages or components.

This ensures that adding authentication to one part of your application won't affect any other parts.

## Authentication Architecture

### 1. Authentication Service

The authentication service (`authentikService.js`) provides core functionality for interacting with the Authentik server:

- **OAuth 2.0 Authorization Code Flow with PKCE** for secure authentication
- **Token management** for handling access and refresh tokens
- **User information retrieval** from Authentik's userinfo endpoint
- **Logout functionality** for proper session termination
- **Isolated storage** using configurable localStorage keys

### 2. Authentication Panel Component

The `AuthentikPanel` component provides a ready-to-use UI for authentication:

- **Login button** that redirects to Authentik
- **User profile display** when authenticated
- **Logout button** for ending the session
- **Customization options** for styling and behavior
- **Isolation controls** to prevent interference with other components

## Implementation Steps

### Server-Side (Authentik Configuration)

1. **Create OAuth Application in Authentik**
   - Log in to https://auth.pkc.pub/
   - Navigate to Applications > Providers
   - Create a new OAuth2/OpenID provider with the following settings:
     - Name: Redux Todo App
     - Client Type: Public
     - Redirect URIs:
       - Development: http://localhost:4321/auth-example
       - Production: https://yourdomain.com/auth-example
     - Scopes: openid, profile, email
   - Note the Client ID for use in your application

2. **Configure User Access**
   - Set up appropriate groups and policies in Authentik
   - Assign users to these groups to control access

### Client-Side (Already Implemented)

1. ✅ **Authentication Service**
   - Created simple service for Authentik integration (`/src/lib/auth/authentikService.js`)
   - Implemented OAuth 2.0 Authorization Code flow with PKCE
   - Added token and user info management
   - Ensured complete isolation from other app components

2. ✅ **Authentication Panel Component**
   - Created standalone panel component (`/src/components/auth/AuthentikPanel.jsx`)
   - Implemented login, profile display, and logout functionality
   - Added customization options
   - Ensured component won't affect other parts of the application

3. ✅ **Example Page**
   - Created example page to demonstrate usage (`/src/pages/auth-example.astro`)
   - Added documentation on how to configure and use the authentication panel
   - Clearly marked the page as an isolated example

4. ✅ **Environment Configuration**
   - Created example .env file with required variables

## Usage Guide

### Adding Authentication to a Page

1. Import the authentication panel component:
   ```jsx
   import AuthentikPanel from '../components/auth/AuthentikPanel';
   ```

2. Add the component to your page:
   ```jsx
   <AuthentikPanel 
     client:load 
     config={{
       clientId: import.meta.env.AUTHENTIK_CLIENT_ID,
       redirectUri: `${import.meta.env.PUBLIC_APP_URL}/your-page`,
       // Use a unique storage key for this page
       storageKey: 'your_page_auth'
     }}
     onLogin={(authData) => {
       console.log('User logged in:', authData.userInfo);
       // Handle successful login
     }}
     onLogout={() => {
       console.log('User logged out');
       // Handle logout
     }}
   />
   ```

### Protecting Content

To conditionally show content based on authentication status:

```jsx
<AuthentikPanel
  client:load
  config={{
    clientId: import.meta.env.AUTHENTIK_CLIENT_ID,
    redirectUri: `${import.meta.env.PUBLIC_APP_URL}/your-page`,
    storageKey: 'your_page_auth'
  }}
  showUserInfo={false}
  customUserInfo={(userInfo, logout) => (
    <div>
      <h2>Welcome, {userInfo.name}!</h2>
      <div>
        {/* Protected content visible only to authenticated users */}
        <p>This content is only visible to authenticated users.</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    </div>
  )}
/>
```

### Ensuring Isolation

To ensure the authentication remains isolated:

1. **Use unique storage keys** for each page where you use the component
2. **Disable the component** when not needed with the `disabled` prop
3. **Control automatic behavior** with props like `checkLoginOnMount` and `autoProcessCallback`

```jsx
<AuthentikPanel
  client:load
  config={{
    clientId: import.meta.env.AUTHENTIK_CLIENT_ID,
    redirectUri: `${import.meta.env.PUBLIC_APP_URL}/your-page`,
    storageKey: 'unique_key_for_this_page'
  }}
  checkLoginOnMount={true} // Only check authentication on this page
  autoProcessCallback={true} // Only process callbacks on this page
/>
```

## Security Considerations

1. **PKCE Implementation**
   - Protects against authorization code interception attacks
   - Essential for public clients (client secret not used)

2. **Token Storage**
   - Access tokens stored in localStorage (client-side only)
   - Token expiration checks to prevent using expired tokens
   - Unique storage keys to prevent conflicts

3. **CSRF Protection**
   - State parameter used during authentication to prevent cross-site request forgery

4. **Redirect URI Validation**
   - Authentik validates redirect URIs to prevent unauthorized redirects

## Future Enhancements

1. **Role-Based Access Control**
   - Utilize Authentik roles for fine-grained access control

2. **Token Refresh**
   - Implement automatic token refresh using refresh tokens

3. **Multi-Factor Authentication**
   - Support for Authentik's MFA capabilities

4. **Custom Styling**
   - Enhanced theme options for the authentication panel

5. **Session Management**
   - Improved session timeout handling and notifications

## Connection with EC2 Instance

The authentication system connects to the Authentik instance running on:
- **Public IP**: 16.78.212.245
- **Public DNS**: ec2-16-78-212-245.ap-southeast-3.compute.amazonaws.com
- **Region**: ap-southeast-3 (Jakarta)
- **Instance Type**: t3.small

## Conclusion

This implementation provides a simple yet secure way to integrate Authentik authentication into your application without the complexity of Redux integration. The standalone authentication panel can be easily added to any page and customized as needed, while remaining completely isolated from the rest of your application.
