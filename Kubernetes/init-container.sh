#!/bin/sh
set -e

echo "Initializing container environment..."

# Create the directory for the authentik client if it doesn't exist
mkdir -p /app/src/lib/authentik

# Create a simple mock authentik client that won't cause import errors
cat > /app/src/lib/authentik/client.js << 'EOF'
// Mock implementation for Kubernetes
export function createClient() {
  console.log('Using mock Authentik client for Kubernetes');
  
  const login = async () => {
    console.log('Mock login in Kubernetes environment');
    return null;
  };

  const handleCallback = async () => {
    console.log('Mock handleCallback in Kubernetes environment');
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

  const getUserInfo = async () => {
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
EOF

echo "Mock authentik client created successfully"

# Set dark theme by default
export ASTRO_THEME_DEFAULT=dark

# Continue with the command passed to the container
exec "$@"
