#!/bin/bash
set -e

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Redux Todo in Astro - Kubernetes Setup ===${NC}"
echo -e "${BLUE}This script will set up a local Kubernetes environment${NC}"
echo -e "${BLUE}using the development server approach to avoid path-to-regexp errors.${NC}"
echo ""

# Check if Docker is running
if ! docker info &>/dev/null; then
  echo -e "${RED}ERROR: Docker is not running.${NC}"
  echo -e "${YELLOW}Please start Docker Desktop or Docker daemon first.${NC}"
  exit 1
fi

# Step 1: Create the namespace
echo -e "${GREEN}Step 1: Creating Kubernetes namespace...${NC}"
kubectl apply -f kubernetes-manifests/01-namespace.yaml

# Step 2: Create PVC for data persistence
echo -e "${GREEN}Step 2: Creating persistent volume claim...${NC}"
kubectl apply -f kubernetes-manifests/07-data-pvc.yaml

# Step 3: Build the Docker image
echo -e "${GREEN}Step 3: Building Docker image from Dockerfile.dev...${NC}"
cd ..
docker build -t redux-todo-dev:latest -f Kubernetes/Dockerfile.dev .
cd Kubernetes

# Step 4: Load the image into Kubernetes
echo -e "${GREEN}Step 4: Loading Docker image into Kubernetes...${NC}"
echo -e "${YELLOW}This step depends on your Kubernetes setup:${NC}"
echo -e "  - For Minikube: minikube image load redux-todo-dev:latest"
echo -e "  - For Kind: kind load docker-image redux-todo-dev:latest"
echo -e "  - For k3d: k3d image import redux-todo-dev:latest"
echo ""

# Choose the right command based on the available Kubernetes distribution
if command -v minikube &>/dev/null && minikube status &>/dev/null; then
  echo "Using Minikube to load the image..."
  minikube image load redux-todo-dev:latest
elif command -v kind &>/dev/null && kind get clusters &>/dev/null; then
  echo "Using Kind to load the image..."
  kind load docker-image redux-todo-dev:latest
elif command -v k3d &>/dev/null && k3d cluster list &>/dev/null; then
  echo "Using k3d to load the image..."
  k3d image import redux-todo-dev:latest
else
  echo -e "${YELLOW}No supported local Kubernetes environment detected.${NC}"
  echo -e "${YELLOW}You may need to manually load the image into your environment.${NC}"
fi

# Step 5: Deploy the application
echo -e "${GREEN}Step 5: Deploying the application...${NC}"
kubectl apply -f kubernetes-manifests/09-dev-astro-deployment.yaml
kubectl apply -f kubernetes-manifests/10-dev-astro-service.yaml

# Step 6: Set up port forwarding
echo -e "${GREEN}Step 6: Setting up access to the application...${NC}"
echo -e "${YELLOW}To access your application, run:${NC}"
echo -e "kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80"
echo -e "${YELLOW}Then open: http://localhost:4323${NC}"

# Step 7: Monitor deployment
echo -e "${GREEN}Step 7: Monitoring deployment...${NC}"
kubectl rollout status deployment/redux-todo-astro-dev -n redux-todo-astro

echo ""
echo -e "${GREEN}==== Deployment Summary ====${NC}"
echo "Application: Redux Todo in Astro (Development Server)"
echo "Namespace: redux-todo-astro"
echo "Deployment: redux-todo-astro-dev"
echo "Service: redux-todo-astro-dev-svc"
echo "Data: Persisted in a PVC named redux-todo-data-pvc"
echo ""
echo -e "${BLUE}==== Helpful Commands ====${NC}"
echo -e "${YELLOW}View all resources in namespace:${NC}"
echo "kubectl get all -n redux-todo-astro"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "kubectl logs -f deployment/redux-todo-astro-dev -n redux-todo-astro"
echo ""
echo -e "${YELLOW}Access application:${NC}"
echo "kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80"
echo "Then visit: http://localhost:4323"
echo ""
echo -e "${YELLOW}Delete deployment:${NC}"
echo "kubectl delete -f kubernetes-manifests/09-dev-astro-deployment.yaml -f kubernetes-manifests/10-dev-astro-service.yaml"
echo ""
echo -e "${BLUE}Deployment completed successfully!${NC}"
