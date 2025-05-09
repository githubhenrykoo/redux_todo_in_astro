#!/bin/bash
# Script to deploy Redux Todo Astro application with 3 pods

# Step 1: Verify Kubernetes cluster
echo "Verifying Kubernetes cluster..."
kubectl cluster-info
if [ $? -ne 0 ]; then
  echo "ERROR: Cannot connect to Kubernetes cluster. Please check if it's running."
  exit 1
fi

# Step 2: Create namespace if it doesn't exist
echo -e "\nCreating namespace if it doesn't exist..."
kubectl get namespace redux-todo-astro > /dev/null 2>&1
if [ $? -ne 0 ]; then
  kubectl create namespace redux-todo-astro
  echo "Namespace 'redux-todo-astro' created."
else
  echo "Namespace 'redux-todo-astro' already exists."
fi

# Step 3: Apply PVC
echo -e "\nCreating PersistentVolumeClaim..."
kubectl apply -f Kubernetes/kubernetes-manifests/07-data-pvc.yaml
echo "PersistentVolumeClaim applied."

# Step 4: Apply Deployment with 3 replicas
echo -e "\nDeploying application with 3 replicas..."
kubectl apply -f Kubernetes/kubernetes-manifests/09-dev-astro-deployment-3replicas.yaml
echo "Deployment applied."

# Step 5: Apply Service
echo -e "\nCreating Service..."
kubectl apply -f Kubernetes/kubernetes-manifests/10-dev-astro-service.yaml
echo "Service applied."

# Step 6: Wait for pods to start
echo -e "\nWaiting for pods to start (this may take a minute)..."
kubectl rollout status deployment/redux-todo-astro-dev -n redux-todo-astro

# Step 7: Check pod status
echo -e "\nChecking pod status..."
kubectl get pods -n redux-todo-astro

# Step 8: Setup port forwarding in the background
echo -e "\nSetting up port forwarding to access the application..."
echo "Starting port forwarding in the background. Access the app at http://localhost:4323"
kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80 &
PORT_FORWARD_PID=$!

echo -e "\nDeployment completed successfully!"
echo "To kill the port forwarding process, run: kill $PORT_FORWARD_PID"

# Add trap to kill port forwarding process when script is interrupted
trap "echo 'Killing port forwarding...'; kill $PORT_FORWARD_PID; exit" INT TERM EXIT
