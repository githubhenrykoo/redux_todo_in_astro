#!/bin/bash
set -e

# Get the base directory path
BASE_DIR="/Users/Henrykoo/Documents/redux_todo_in_astro"
KUBERNETES_DIR="$BASE_DIR/Kubernetes"

echo "Building production Docker image for Redux Todo in Astro..."
docker build -t redux-todo-prod:latest -f "$KUBERNETES_DIR/Dockerfile.prod" "$BASE_DIR"

echo "Loading the production image into Kubernetes cluster..."
kind load docker-image redux-todo-prod:latest --name redux-todo-cluster

echo "Creating or updating the production deployment YAML..."
mkdir -p "$KUBERNETES_DIR/kubernetes-manifests"
cat > "$KUBERNETES_DIR/kubernetes-manifests/09-prod-astro-deployment.yaml" << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redux-todo-astro-prod
  namespace: redux-todo-astro
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redux-todo-astro-prod
  template:
    metadata:
      labels:
        app: redux-todo-astro-prod
    spec:
      containers:
      - name: redux-todo-astro
        image: redux-todo-prod:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 4321
          name: http
        - containerPort: 24678
          name: websocket
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "0.5"
            memory: "256Mi"
        env:
        - name: NODE_ENV
          value: "development"
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "4321"
        - name: ASTRO_TELEMETRY_DISABLED
          value: "1"
        - name: VITE_HMR_PROTOCOL
          value: "ws"
        - name: VITE_HMR_HOST
          value: "0.0.0.0"
        - name: VITE_HMR_PORT
          value: "24678"
        - name: VITE_HMR_CLIENT_PORT
          value: "24678"
EOF

# Create the WebSocket-enabled service separately
cat > "$KUBERNETES_DIR/kubernetes-manifests/10-prod-astro-service.yaml" << EOF
apiVersion: v1
kind: Service
metadata:
  name: redux-todo-astro-prod-svc
  namespace: redux-todo-astro
spec:
  selector:
    app: redux-todo-astro-prod
  ports:
  - name: http
    port: 80
    targetPort: 4321
  - name: websocket
    port: 24678
    targetPort: 24678
  type: ClusterIP
EOF

echo "Applying the production deployment to Kubernetes..."
kubectl apply -f "$KUBERNETES_DIR/kubernetes-manifests/09-prod-astro-deployment.yaml"
kubectl apply -f "$KUBERNETES_DIR/kubernetes-manifests/10-prod-astro-service.yaml"

echo "Waiting for deployment to complete..."
kubectl rollout status deployment/redux-todo-astro-prod -n redux-todo-astro

echo "Setting up port forwarding to access the application..."
# Kill any existing port forwarding on relevant ports
lsof -ti:4324 | xargs kill -9 2>/dev/null || true
lsof -ti:24678 | xargs kill -9 2>/dev/null || true

# Start HTTP port forwarding
kubectl port-forward service/redux-todo-astro-prod-svc -n redux-todo-astro 4324:80 &
HTTP_PORT_FORWARD_PID=$!

# Start WebSocket port forwarding
kubectl port-forward service/redux-todo-astro-prod-svc -n redux-todo-astro 24678:24678 &
WS_PORT_FORWARD_PID=$!

echo "Deployment completed successfully!"
echo "Access the production application at http://localhost:4324"
echo "WebSocket HMR running on ws://localhost:24678"
echo "To kill the port forwarding processes, run:"
echo "kill $HTTP_PORT_FORWARD_PID $WS_PORT_FORWARD_PID"
