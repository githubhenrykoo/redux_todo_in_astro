#!/bin/bash
set -e

# Stop any existing Minikube cluster
if minikube status &>/dev/null; then
  echo "Stopping existing Minikube cluster..."
  minikube stop
  minikube delete
fi

# Start Minikube with multiple nodes
echo "Starting Minikube with 3 nodes..."
minikube start --nodes 3 --driver=docker --kubernetes-version=v1.26.3

# Enable the ingress addon
echo "Enabling Ingress addon..."
minikube addons enable ingress

# Create the namespace
echo "Creating namespace..."
kubectl create namespace redux-todo-astro || echo "Namespace already exists"

# Apply the PVC
echo "Creating PVC..."
kubectl apply -f kubernetes-manifests/07-data-pvc.yaml

# Print cluster info
echo "Minikube cluster is ready with 3 nodes:"
kubectl get nodes

echo "Use 'minikube docker-env' to set up Docker environment:"
echo "eval \$(minikube -p minikube docker-env)"
echo ""
echo "Then build your Docker image:"
echo "docker build -t redux-todo-dev:latest -f Kubernetes/Dockerfile.dev ."
