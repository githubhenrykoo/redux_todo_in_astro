#!/bin/bash
set -e

# Get the base directory path
BASE_DIR="/Users/Henrykoo/Documents/redux_todo_in_astro"
KUBERNETES_DIR="$BASE_DIR/Kubernetes"

# Change to the Kubernetes directory
cd $KUBERNETES_DIR

# Build Docker image
echo "Building static production Docker image for Redux Todo in Astro..."
docker build -t redux-todo-astro:latest -f Dockerfile.prod $BASE_DIR

# Try to detect which Kubernetes cluster to use
if command -v kind &>/dev/null && kind get clusters | grep -q redux-todo-cluster; then
  echo "Loading the production image into redux-todo-cluster..."
  kind load docker-image redux-todo-astro:latest --name redux-todo-cluster
elif command -v kind &>/dev/null && kind get clusters | grep -q kind; then
  echo "Loading the production image into kind cluster..."
  kind load docker-image redux-todo-astro:latest --name kind
else
  echo "Could not detect Kubernetes cluster. Please enter the cluster name:"
  read -p "Cluster name: " cluster_name
  kind load docker-image redux-todo-astro:latest --name $cluster_name
fi

# Create namespace if it doesn't exist
echo "Creating namespace if it doesn't exist..."
kubectl create namespace redux-todo-astro --dry-run=client -o yaml | kubectl apply -f -
# Apply the existing Kubernetes manifest files
echo "Applying Kubernetes manifests..."
kubectl apply -f "$KUBERNETES_DIR/kubernetes-manifests/09-prod-astro-deployment.yaml"
kubectl apply -f "$KUBERNETES_DIR/kubernetes-manifests/10-prod-astro-service.yaml"

# Wait for deployment to be ready
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/redux-todo-astro-prod -n redux-todo-astro

# Set up port forwarding
echo "Setting up port forwarding..."
# Kill any existing port forwarding on relevant ports
lsof -ti:4321 | xargs kill -9 2>/dev/null || true
lsof -ti:24678 | xargs kill -9 2>/dev/null || true

# Start HTTP port forwarding
kubectl port-forward -n redux-todo-astro svc/redux-todo-astro-prod-service 4321:4321 &
HTTP_PORT_FORWARD_PID=$!

# Start WebSocket port forwarding
kubectl port-forward -n redux-todo-astro svc/redux-todo-astro-prod-service 24678:24678 &
WS_PORT_FORWARD_PID=$!

echo "Deployment completed successfully!"
echo "Application is accessible at http://localhost:4321"
echo "WebSocket HMR running on ws://localhost:24678"
echo "Press Ctrl+C to stop port forwarding"

# Trap to kill port forwarding when script is interrupted
trap "kill $HTTP_PORT_FORWARD_PID $WS_PORT_FORWARD_PID" INT TERM EXIT

# Wait for port forwarding processes
wait $HTTP_PORT_FORWARD_PID $WS_PORT_FORWARD_PID
