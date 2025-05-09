// Mock implementation of the authentik client for Kubernetes environment
export function createClient() {
  console.log('Using mock authentik client for Kubernetes');
  
  return {
    login: async () => { 
      console.log('Mock login called');
      return null;
    },
    logout: async () => {
      console.log('Mock logout called');
      return null;
    },
    getUserInfo: async () => {
      console.log('Mock getUserInfo called');
      return null;
    }
  };
}

export default { createClient };
