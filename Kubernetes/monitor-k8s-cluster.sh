#!/bin/bash

# Color codes
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}   Redux Todo in Astro Kubernetes Dashboard   ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if the cluster exists
if ! kind get clusters | grep -q redux-todo-cluster; then
  echo -e "${RED}Cluster not found! Please run setup-k8s-cluster.sh first.${NC}"
  exit 1
fi

# Check nodes status
echo -e "\n${YELLOW}Checking Node Status:${NC}"
kubectl get nodes -o wide

# Check namespace
echo -e "\n${YELLOW}Checking Namespace:${NC}"
kubectl get namespace redux-todo-astro

# Check pods status
echo -e "\n${YELLOW}Checking Pods Status:${NC}"
kubectl get pods -n redux-todo-astro -o wide

# Check deployment status
echo -e "\n${YELLOW}Checking Deployment Status:${NC}"
kubectl get deployment -n redux-todo-astro

# Check service status
echo -e "\n${YELLOW}Checking Service Status:${NC}"
kubectl get services -n redux-todo-astro

# Check ingress status
echo -e "\n${YELLOW}Checking Ingress Status:${NC}"
kubectl get ingress -n redux-todo-astro

# Check persistent volume claims
echo -e "\n${YELLOW}Checking PVC Status:${NC}"
kubectl get pvc -n redux-todo-astro

# Show resource utilization
echo -e "\n${YELLOW}Resource Utilization:${NC}"
kubectl top nodes 2>/dev/null || echo "metrics-server not available - can't show resource usage"

# Show how to access the application
echo -e "\n${GREEN}===== Access Information =====${NC}"
echo -e "You can access your application with one of these methods:"
echo -e "1. If you've updated your hosts file: ${GREEN}http://redux-todo.local${NC}"
echo -e "2. Via port-forward: Run the command below and access at ${GREEN}http://localhost:4323${NC}"
echo -e "   ${BLUE}kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80${NC}"

echo -e "\n${GREEN}===== Logs =====${NC}"
echo "To view logs of a pod, run:"
echo "kubectl logs -f <pod-name> -n redux-todo-astro"
