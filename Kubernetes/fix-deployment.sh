#!/bin/bash
set -e

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Redux Todo in Astro - Deployment Fix ===${NC}"
echo -e "${YELLOW}This script will fix the ImagePullBackOff issue by:${NC}"
echo -e "  - Building a local Docker image from Dockerfile.dev"
echo -e "  - Loading the image into your Kubernetes cluster"
echo -e "  - Applying the updated deployment configuration"
echo ""

# Step 1: Check Docker is running
if ! docker info &>/dev/null; then
  echo -e "${RED}ERROR: Docker is not running.${NC}"
  echo -e "${YELLOW}Please start Docker Desktop or Docker daemon first.${NC}"
  exit 1
fi

# Step 2: Build the Docker image
echo -e "${GREEN}Step 1: Building Docker image from Dockerfile.dev...${NC}"
cd ..
docker build -t redux-todo-dev:latest -f Kubernetes/Dockerfile.dev .
cd Kubernetes

# Step 3: Load the image into Kubernetes
echo -e "${GREEN}Step 2: Loading Docker image into Kubernetes...${NC}"

# Try to detect the Kubernetes environment
if command -v minikube &>/dev/null && minikube status &>/dev/null; then
  echo "Using Minikube to load the image..."
  minikube image load redux-todo-dev:latest
elif command -v kind &>/dev/null && kind get clusters &>/dev/null; then
  echo "Using Kind to load the image..."
  kind load docker-image redux-todo-dev:latest --name redux-todo-cluster
else
  echo -e "${YELLOW}Could not automatically detect Kubernetes environment.${NC}"
  echo -e "Please select your Kubernetes environment:"
  echo -e "  1) Minikube"
  echo -e "  2) Kind"
  echo -e "  3) k3d"
  echo -e "  4) Other (skip image loading)"
  read -p "Enter your choice (1-4): " k8s_choice
  
  case $k8s_choice in
    1)
      minikube image load redux-todo-dev:latest
      ;;
    2)
      kind load docker-image redux-todo-dev:latest
      ;;
    3)
      k3d image import redux-todo-dev:latest
      ;;
    4)
      echo "Skipping image loading. Make sure your Kubernetes cluster can access the image."
      ;;
    *)
      echo "Invalid choice. Skipping image loading."
      ;;
  esac
fi

# Step 4: Apply the updated deployment and service
echo -e "${GREEN}Step 3: Applying deployment and service...${NC}"
kubectl apply -f kubernetes-manifests/09-dev-astro-deployment.yaml
kubectl apply -f kubernetes-manifests/10-dev-astro-service.yaml

# Step 5: Restart the deployment to ensure it uses the new image
echo -e "${GREEN}Step 4: Restarting deployment...${NC}"
kubectl rollout restart deployment/redux-todo-astro-dev -n redux-todo-astro

# Step 6: Monitor deployment status
echo -e "${GREEN}Step 5: Monitoring deployment status...${NC}"
kubectl rollout status deployment/redux-todo-astro-dev -n redux-todo-astro --timeout=180s || true

echo -e "${GREEN}Checking pod status...${NC}"
kubectl get pods -n redux-todo-astro

# Step 7: Set up port forwarding
echo -e "${GREEN}Setting up port forwarding to access the application...${NC}"
echo -e "${YELLOW}Starting port forwarding in the background. Access the app at ${GREEN}http://localhost:4323${NC}"
kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80 &
PORT_FORWARD_PID=$!

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}To kill the port forwarding process, run: ${GREEN}kill $PORT_FORWARD_PID${NC}"

# Register a trap to kill the port forwarding when script exits
trap "echo 'Killing port forwarding...'; kill $PORT_FORWARD_PID 2>/dev/null || true" EXIT
