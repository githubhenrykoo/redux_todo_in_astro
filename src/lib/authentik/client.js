// Mock authentik client for Kubernetes deployment
// This file exists solely to prevent SSR import errors

export function createClient() {
  console.log('Using mock authentik client for Kubernetes');
  return {
    login: async () => null,
    logout: async () => null,
    getUserInfo: async () => ({
      sub: 'kubernetes-user',
      email: 'kubernetes-user@example.com',
      email_verified: true
    })
  };
}

export default { createClient };
