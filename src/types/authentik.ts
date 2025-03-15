import React from 'react';

export interface AuthentikConfig {
  clientId: string;
  redirectUri: string;
  scopes: string;
  baseUrl: string;
  storageKey: string;
}

export interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

export interface AuthentikPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  config: AuthentikConfig;
  renderUserInfo?: (info: UserInfo | null) => React.ReactNode;
  customLoginButton?: (handleLogin: (...args: any[]) => void | Promise<void>, loading: boolean) => React.ReactNode;
  customLogoutButton?: (handleLogout: (...args: any[]) => void | Promise<void>, loading: boolean) => React.ReactNode;
  'client:only'?: 'react' | 'vue' | 'svelte' | 'preact' | 'solid' | 'lit';
}
