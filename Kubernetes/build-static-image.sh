#!/bin/bash

# Script to build and push a static version of the Redux Todo in Astro application

echo "Building static Docker image..."

# Set the image name and tag
IMAGE_NAME="henry768/redux_todo_in_astro"
IMAGE_TAG="static"

# Navigate to the root directory to have access to all files
cd ..

# Build the Docker image
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Kubernetes/Dockerfile.static .

# Push the image to Docker Hub
echo "Pushing static image to Docker Hub..."
docker push ${IMAGE_NAME}:${IMAGE_TAG}

echo "Static image built and pushed successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
