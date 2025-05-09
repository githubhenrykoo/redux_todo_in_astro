#!/bin/bash
set -e

echo "Running deep debugging on the Kubernetes deployment..."

# Get the pod name
POD_NAME=$(kubectl get pods -n redux-todo-astro -l app=redux-todo-astro-prod -o jsonpath="{.items[0].metadata.name}")
echo "Pod name: $POD_NAME"

# Check pod details
echo "=== Pod Details ==="
kubectl describe pod $POD_NAME -n redux-todo-astro

# Get the node where the pod is running
NODE_NAME=$(kubectl get pod $POD_NAME -n redux-todo-astro -o jsonpath="{.spec.nodeName}")
echo "Running on node: $NODE_NAME"

# Check the environment variables in the pod
echo "=== Environment Variables ==="
kubectl exec $POD_NAME -n redux-todo-astro -- env | sort

# Check if the authentik client file exists
echo "=== Checking for authentik client ==="
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/lib/authentik/ 2>/dev/null || echo "Directory not found"

# Check which TopBar components exist
echo "=== Checking TopBar components ==="
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/components/panels/ | grep -E "TopBar|K8s"

# Check the import in the DefaultLayout.astro file
echo "=== DefaultLayout imports ==="
kubectl exec $POD_NAME -n redux-todo-astro -- grep -A 10 "import" /app/src/layouts/DefaultLayout.astro

# View the logs from the pod
echo "=== Pod Logs ==="
kubectl logs $POD_NAME -n redux-todo-astro --tail=50

# Check file system permissions
echo "=== File System Permissions ==="
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/

echo "Deep debugging complete"
