import { ReactElement } from 'react';

interface AuthentikConfig {
  clientId: string;
  redirectUri?: string;
  scopes?: string;
  storageKey?: string;
  [key: string]: any;
}

export interface AuthentikPanelProps {
  config?: AuthentikConfig;
  onLogin?: (authData: any) => void;
  onLogout?: () => void;
  className?: string;
  showUserInfo?: boolean;
  customLoginButton?: (handleLogin: () => void, loading: boolean) => ReactElement;
  customLogoutButton?: (handleLogout: () => void, loading: boolean) => ReactElement;
  customUserInfo?: (userInfo: any, handleLogout: () => void) => ReactElement;
  checkLoginOnMount?: boolean;
  autoProcessCallback?: boolean;
  storageKeyPrefix?: string;
  disabled?: boolean;
  'client:load'?: boolean;
  'client:visible'?: boolean;
  'client:only'?: boolean;
  'client:idle'?: boolean;
}

declare const AuthentikPanel: React.FC<AuthentikPanelProps>;

export default AuthentikPanel;
