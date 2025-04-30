#!/bin/bash
set -e

# Build the patched Docker image
echo "Building patched Docker image..."
docker build -t henry768/redux_todo_in_astro:patched -f Dockerfile.patched .

# Push the patched image to Docker Hub
echo "Pushing patched image to Docker Hub..."
docker push henry768/redux_todo_in_astro:patched

echo "Patched image built and pushed successfully: henry768/redux_todo_in_astro:patched"
