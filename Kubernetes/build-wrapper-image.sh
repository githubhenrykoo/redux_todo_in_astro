#!/bin/bash

# Build the Docker image with wrapper server
echo "Building wrapper server image..."
docker build -t henry768/redux_todo_in_astro:wrapper -f Kubernetes/Dockerfile.wrapper ..

# Push the image to Docker Hub
echo "Pushing wrapper server image to Docker Hub..."
docker push henry768/redux_todo_in_astro:wrapper

echo "Build and push completed!"
