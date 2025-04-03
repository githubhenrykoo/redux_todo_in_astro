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
  email_verified?: boolean;
  sub?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  preferred_username?: string;
  groups?: string[];
  // Token information
  access_token?: string;
  id_token?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  auth_time?: number;
  // Authentication flow metadata
  token_source?: string;
  detection_method?: string; // Similar to your file detection tracking
}

export interface AuthentikPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  config: AuthentikConfig;
  renderUserInfo?: (info: UserInfo | null) => React.ReactNode;
  customLoginButton?: (handleLogin: (...args: any[]) => void | Promise<void>, loading: boolean) => React.ReactNode;
  customLogoutButton?: (handleLogout: (...args: any[]) => void | Promise<void>, loading: boolean) => React.ReactNode;
  'client:only'?: 'react' | 'vue' | 'svelte' | 'preact' | 'solid' | 'lit';
}
