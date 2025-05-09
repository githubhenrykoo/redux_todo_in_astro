#!/bin/bash
set -e

echo "Debugging the Kubernetes deployment..."

# Get the pod name of our app
POD_NAME=$(kubectl get pods -n redux-todo-astro -l app=redux-todo-astro-prod -o jsonpath="{.items[0].metadata.name}")
echo "Pod name: $POD_NAME"

# Check if the problematic file exists in the container
echo "Checking if authentik client file exists in the container..."
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/lib/authentik/ || echo "Directory or file not found"

# Check which TopBar component is being used
echo "Checking which TopBar components exist..."
kubectl exec $POD_NAME -n redux-todo-astro -- ls -la /app/src/components/panels/ | grep -E "TopBar|K8s"

# Display the content of DefaultLayout.astro to see which component it imports
echo "Checking DefaultLayout.astro imports..."
kubectl exec $POD_NAME -n redux-todo-astro -- grep -A 10 "import" /app/src/layouts/DefaultLayout.astro

# Check if our entrypoint script was executed
echo "Checking if entrypoint created mock client..."
kubectl exec $POD_NAME -n redux-todo-astro -- cat /app/src/lib/authentik/client.js 2>/dev/null || echo "Mock client not found"

echo "Debugging complete."
