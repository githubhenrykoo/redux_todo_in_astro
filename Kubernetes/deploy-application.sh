#!/bin/bash
set -e

# Check if cluster exists
if ! kind get clusters | grep -q redux-todo-cluster; then
  echo "Cluster not found. Run setup-k8s-cluster.sh first."
  exit 1
fi

echo "Deploying Redux Todo in Astro to Kubernetes cluster..."

# Update the dev deployment to use local image and appropriate pull policy
cat << EOF > kubernetes-manifests/09-dev-astro-deployment-local.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redux-todo-astro-dev
  namespace: redux-todo-astro
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redux-todo-astro-dev
  template:
    metadata:
      labels:
        app: redux-todo-astro-dev
    spec:
      containers:
      - name: redux-todo-astro
        image: redux-todo-dev
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 4321
          name: http
        resources:
          requests:
            cpu: 200m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        env:
        - name: NODE_ENV
          value: "development"
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "4321"
        - name: ASTRO_TELEMETRY_DISABLED
          value: "1"
        volumeMounts:
        - name: redux-todo-data
          mountPath: /app/data
      volumes:
      - name: redux-todo-data
        persistentVolumeClaim:
          claimName: redux-todo-data-pvc
EOF

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f kubernetes-manifests/09-dev-astro-deployment-local.yaml
kubectl apply -f kubernetes-manifests/10-dev-astro-service.yaml

# Create ingress for local access
cat << EOF > kubernetes-manifests/local-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: redux-todo-astro-ingress
  namespace: redux-todo-astro
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: redux-todo.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: redux-todo-astro-dev-svc
            port:
              number: 80
EOF

kubectl apply -f kubernetes-manifests/local-ingress.yaml

echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/redux-todo-astro-dev -n redux-todo-astro

echo "Application deployed successfully!"
echo "Add 'redux-todo.local' to your /etc/hosts file pointing to 127.0.0.1"
echo "echo '127.0.0.1 redux-todo.local' | sudo tee -a /etc/hosts"
echo ""
echo "Then access your application at: http://redux-todo.local"
echo ""
echo "Alternatively, run this port-forward command:"
echo "kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80"
echo "And access your application at: http://localhost:4323"
