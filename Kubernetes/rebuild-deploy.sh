#!/bin/bash
set -e

echo "Rebuilding and deploying Redux Todo in Astro to Kubernetes with authentik fix"

# Ensure we're in the project root
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Step 1: Create the mock authentik client
echo "Creating mock authentik client..."
mkdir -p "$PROJECT_ROOT/src/lib/authentik"
cat > "$PROJECT_ROOT/src/lib/authentik/client.js" << 'EOF'
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
EOF

# Step 2: Create K8sTopBar component if it doesn't exist
mkdir -p "$PROJECT_ROOT/src/components/panels"
if [ ! -f "$PROJECT_ROOT/src/components/panels/K8sTopBar.tsx" ]; then
  echo "Creating K8sTopBar component..."
  cat > "$PROJECT_ROOT/src/components/panels/K8sTopBar.tsx" << 'EOF'
import { useState } from 'react';
import '../styles/TopBar.css';

export default function K8sTopBar() {
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };
  
  return (
    <header className={`topbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="topbar-left">
        <div className="app-title">Redux Todo in Astro (K8s)</div>
      </div>
      
      <div className="topbar-right">
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        
        <div className="user-info">
          <span className="username">K8s User</span>
        </div>
      </div>
    </header>
  );
}
EOF
fi

# Step 3: Update DefaultLayout to use K8sTopBar
echo "Updating DefaultLayout to use K8sTopBar..."
if grep -q "import TopBar from .*" "$PROJECT_ROOT/src/layouts/DefaultLayout.astro"; then
  sed -i.bak "s/import TopBar from .*$/import TopBar from \"\.\.\/components\/panels\/K8sTopBar\";/g" "$PROJECT_ROOT/src/layouts/DefaultLayout.astro"
  rm -f "$PROJECT_ROOT/src/layouts/DefaultLayout.astro.bak"
fi

# Step 4: Create a Dockerfile for the build
echo "Creating Dockerfile..."
cat > "$PROJECT_ROOT/Kubernetes/Dockerfile.k8s" << 'EOF'
# Use Node.js v18 Alpine as the base image
FROM node:18-alpine

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ python3-dev py3-setuptools sqlite sqlite-dev

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Ensure the authentik client directory and K8sTopBar exist
# The mock files should already be in place from our script

# Create necessary directories and set permissions
RUN mkdir -p /app/.astro && \
    chown -R astro:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER astro

# Set environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4321
ENV ASTRO_TELEMETRY_DISABLED=1
ENV IS_KUBERNETES=true
ENV VITE_HMR_PROTOCOL=ws
ENV VITE_HMR_HOST=0.0.0.0
ENV VITE_HMR_PORT=24678
ENV VITE_HMR_CLIENT_PORT=24678
ENV THEME_DEFAULT=dark

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

# Step 5: Build the Docker image
echo "Building Docker image..."
docker build -t redux-todo-astro:latest -f "$PROJECT_ROOT/Kubernetes/Dockerfile.k8s" .

# Step 6: Load the image into the Kind cluster
echo "Loading image into Kind cluster..."
kind load docker-image redux-todo-astro:latest --name redux-todo-cluster

# Step 7: Apply the Kubernetes manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f "$PROJECT_ROOT/Kubernetes/kubernetes-manifests/09-prod-astro-deployment.yaml" -n redux-todo-astro
kubectl apply -f "$PROJECT_ROOT/Kubernetes/kubernetes-manifests/10-prod-astro-service.yaml" -n redux-todo-astro

# Step 8: Wait for the deployment to be ready
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/redux-todo-astro-prod -n redux-todo-astro

echo "Deployment completed!"
echo "Setup port forwarding with:"
echo "kubectl port-forward svc/redux-todo-astro-prod-service -n redux-todo-astro 4321:4321 24678:24678"
