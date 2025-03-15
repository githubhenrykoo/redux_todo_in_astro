import React from 'react';

interface AuthentikConfig {
  clientId: string;
  redirectUri: string;
  scopes: string;
  baseUrl: string;
  storageKey: string;
}

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthentikPanelProps {
  config: AuthentikConfig;
  renderUserInfo?: (info: UserInfo | null) => React.ReactNode;
  customLoginButton?: (handleLogin: () => void, loading: boolean) => React.ReactNode;
  customLogoutButton?: (handleLogout: () => void, loading: boolean) => React.ReactNode;
}

declare const AuthentikPanel: React.FC<AuthentikPanelProps>;

export default AuthentikPanel;
