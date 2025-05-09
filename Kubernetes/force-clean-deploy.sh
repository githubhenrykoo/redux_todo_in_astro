#!/bin/bash
set -e

echo "Starting clean deployment for Redux Todo App in Kubernetes..."

# Ensure we're in the project root for consistency
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Step 1: Ensure the authentik directory exists with mock client
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

echo "Created mock authentik client"

# Step 2: Update the Dockerfile to force a clean build
DOCKERFILE_PATH="$PROJECT_ROOT/Kubernetes/Dockerfile.prod.clean"
cat > "$DOCKERFILE_PATH" << 'EOF'
# Use Node.js v18 Alpine as the base image
FROM node:18-alpine as base

# Create the deps stage for installing dependencies
FROM base as deps

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ python3-dev py3-setuptools sqlite sqlite-dev

# Copy package.json and lock files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Create the runner stage for the application
FROM base as runner

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro

# Set working directory
WORKDIR /app

# Copy the deps from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/.astro && \
    chown -R astro:nodejs /app && \
    chmod -R 755 /app

# Create the authentik client directory if it doesn't exist
RUN mkdir -p /app/src/lib/authentik

# Create a mock authentik client to prevent import errors
RUN echo 'export function createClient() { console.log("Mock client"); return { login: () => {}, logout: () => {}, getUserInfo: () => ({}) }; }' > /app/src/lib/authentik/client.js

# Update DefaultLayout to use K8sTopBar
RUN sed -i "s/import TopBar from .*$/import TopBar from \"\.\.\/components\/panels\/K8sTopBar\";/g" /app/src/layouts/DefaultLayout.astro || true

# Switch to non-root user
USER astro

# Environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4321
ENV ASTRO_TELEMETRY_DISABLED=1
ENV IS_KUBERNETES=true

# Add Vite specific configurations for external access
ENV VITE_HMR_PROTOCOL=ws
ENV VITE_HMR_HOST=0.0.0.0
ENV VITE_HMR_PORT=24678
ENV VITE_HMR_CLIENT_PORT=24678

# Set environment variable for dark mode
ENV THEME_DEFAULT=dark

# Start the development server with appropriate flags
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

echo "Created clean Dockerfile"

# Step 3: Build a completely new image with no cache
echo "Building fresh Docker image with no cache..."
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"
docker build --no-cache -t redux-todo-astro:latest -f "$DOCKERFILE_PATH" .

# Step 4: Load the image into the cluster
echo "Loading image into the cluster..."
kind load docker-image redux-todo-astro:latest --name redux-todo-cluster

# Step 5: Apply the Kubernetes manifests
echo "Creating namespace if it doesn't exist..."
kubectl create namespace redux-todo-astro 2>/dev/null || kubectl get namespace redux-todo-astro >/dev/null

echo "Applying Kubernetes manifests..."
kubectl apply -f Kubernetes/kubernetes-manifests/09-prod-astro-deployment.yaml -n redux-todo-astro
kubectl apply -f Kubernetes/kubernetes-manifests/10-prod-astro-service.yaml -n redux-todo-astro

# Step 6: Wait for the deployment to be ready
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/redux-todo-astro-prod -n redux-todo-astro

# Step 7: Verify that our fix worked
echo "Verifying that the mock authentik client exists..."
POD_NAME=$(kubectl get pods -n redux-todo-astro -l app=redux-todo-astro-prod -o jsonpath="{.items[0].metadata.name}")
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/lib/authentik/ || echo "Directory not found"
kubectl exec $POD_NAME -n redux-todo-astro -- cat /app/src/lib/authentik/client.js

echo "Verifying DefaultLayout imports..."
kubectl exec $POD_NAME -n redux-todo-astro -- grep -A 5 "import TopBar" /app/src/layouts/DefaultLayout.astro

# Step 8: Set up port forwarding
echo "Setting up port forwarding..."
echo "Deployment completed successfully!"
echo "Application is accessible at http://localhost:4321"
echo "WebSocket HMR running on ws://localhost:24678"
echo "Press Ctrl+C to stop port forwarding"

kubectl port-forward svc/redux-todo-astro-prod-service -n redux-todo-astro 4321:4321 24678:24678
