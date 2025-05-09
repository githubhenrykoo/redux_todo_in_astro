#!/bin/bash
set -e

# Install k3d if it's not already installed
if ! command -v k3d &> /dev/null; then
  echo "Installing k3d..."
  brew install k3d
fi

# Delete existing cluster if it exists
if k3d cluster list | grep -q redux-todo; then
  echo "Deleting existing k3d cluster..."
  k3d cluster delete redux-todo
fi

# Create a new k3d cluster with 3 nodes (1 server, 2 agents)
echo "Creating k3d cluster 'redux-todo' with 3 nodes..."
k3d cluster create redux-todo \
  --api-port 6550 \
  --servers 1 \
  --agents 2 \
  --port 8080:80@loadbalancer \
  --port 8443:443@loadbalancer

echo "Waiting for nodes to be ready..."
kubectl wait --for=condition=ready nodes --all --timeout=2m

echo "Creating namespace..."
kubectl create namespace redux-todo-astro || echo "Namespace already exists"

# Apply PVC manifest
echo "Creating PVC..."
kubectl apply -f kubernetes-manifests/07-data-pvc.yaml

echo "k3d cluster is ready with 3 nodes:"
kubectl get nodes

echo "You can now deploy your application to the cluster."
echo "Use port 8080 to access your application once deployed."
