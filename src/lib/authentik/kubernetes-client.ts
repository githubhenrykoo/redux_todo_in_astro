import type { UserInfo } from '../../types/authentik.js';

interface AuthentikClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  baseUrl: string;
  storageKey: string;
}

// This is a simplified mock version of the authentik client for Kubernetes
// It provides the same interface but doesn't perform actual authentication operations
export function createClient(config: AuthentikClientConfig) {
  // Stub implementation for Kubernetes environments
  const login = async (originalUrl?: string) => {
    console.log('Mock login in Kubernetes environment');
    return null;
  };

  const handleCallback = async (code: string): Promise<UserInfo> => {
    console.log('Mock handleCallback in Kubernetes environment');
    // Return a mock user
    return {
      sub: 'kubernetes-user',
      email: 'kubernetes-user@example.com',
      email_verified: true
    };
  };

  const logout = async () => {
    console.log('Mock logout in Kubernetes environment');
    return null;
  };

  const getUserInfo = async (): Promise<UserInfo | null> => {
    // Return a mock user
    return {
      sub: 'kubernetes-user',
      email: 'kubernetes-user@example.com',
      email_verified: true
    };
  };

  return {
    login,
    handleCallback,
    logout,
    getUserInfo
  };
}
