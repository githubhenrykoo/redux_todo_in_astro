#!/bin/bash
set -e

echo "Building Redux Todo development Docker image..."

# Navigate to the project root directory
cd "$(dirname "$0")/.."

# Build the development image
docker build -t redux-todo-dev -f Kubernetes/Dockerfile.dev .

# Load the image into kind cluster
echo "Loading image into kind cluster..."
kind load docker-image redux-todo-dev --name redux-todo-cluster

echo "Docker image built and loaded successfully!"
