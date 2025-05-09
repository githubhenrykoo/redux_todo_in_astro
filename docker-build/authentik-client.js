// Mock authentik client for Docker/Kubernetes deployment
// This file exists solely to prevent SSR import errors

export function createClient(config) {
  console.log("Using mock authentik client for Docker/K8s");
  
  return {
    login: async () => Promise.resolve(null),
    logout: async () => Promise.resolve(null),
    getUserInfo: async () => Promise.resolve({
      sub: "docker-user",
      name: "Docker User",
      email: "docker-user@example.com",
      email_verified: true,
      preferred_username: "docker-user"
    })
  };
}

export default { createClient };
