#!/bin/bash
set -e

echo "Creating 5-node Kubernetes cluster using kind..."
kind create cluster --config=kind-config.yaml

echo "Waiting for nodes to be ready..."
kubectl wait --for=condition=ready nodes --all --timeout=5m

echo "Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo "Creating namespace..."
kubectl apply -f kubernetes-manifests/01-namespace.yaml

echo "Creating storage resources..."
kubectl apply -f kubernetes-manifests/07-data-pvc.yaml

echo "Cluster is ready to deploy applications!"
