#!/bin/bash

# Script to build and push a minimal version of the Redux Todo in Astro application
# This version retains server mode but uses a patched server to avoid the path-to-regexp error

echo "Building minimal server image..."

# Set the image name and tag
IMAGE_NAME="henry768/redux_todo_in_astro"
IMAGE_TAG="minimal"

# Navigate to the root directory to have access to all files
cd ..

# Build the Docker image
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Kubernetes/Dockerfile.fixed .

# Push the image to Docker Hub
echo "Pushing minimal server image to Docker Hub..."
docker push ${IMAGE_NAME}:${IMAGE_TAG}

echo "Minimal server image built and pushed successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
