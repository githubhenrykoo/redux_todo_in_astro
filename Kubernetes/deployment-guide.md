# Redux Todo in Astro - Kubernetes Deployment Guide

## Introduction

This guide provides step-by-step instructions for deploying the Redux Todo in Astro application to a Kubernetes cluster. The guide assumes you have already downloaded all necessary components and are ready to deploy.

## Prerequisites

- Docker installed and configured
- Kubernetes cluster running (Minikube, Docker Desktop Kubernetes, etc.)
- `kubectl` CLI configured to interact with your cluster
- The Redux Todo in Astro application code
- Pre-built Docker images (redux-todo-dev)

## Deployment Steps

### 1. Verify Your Environment

Before deploying, verify your Kubernetes environment is properly configured:

```bash
# Check if kubectl is properly configured
kubectl cluster-info

# Check if your Kubernetes context is set correctly
kubectl config current-context
```

### 2. Verify Docker Images

Ensure the Docker image is available:

```bash
# For local Kubernetes (Minikube):
minikube image ls | grep redux-todo-dev

# If the image is not available in Minikube, load it:
minikube image load redux-todo-dev
```

### 3. Create Kubernetes Namespace

Create a dedicated namespace for the application:

```bash
# Create namespace
kubectl create namespace redux-todo-astro

# Verify namespace creation
kubectl get namespace redux-todo-astro
```

### 4. Deploy Kubernetes Resources

Apply the Kubernetes manifest files:

```bash
# Create PersistentVolumeClaim for data storage
kubectl apply -f Kubernetes/kubernetes-manifests/07-data-pvc.yaml

# Create Deployment
kubectl apply -f Kubernetes/kubernetes-manifests/09-dev-astro-deployment.yaml

# Create Service
kubectl apply -f Kubernetes/kubernetes-manifests/10-dev-astro-service.yaml
```

### 5. Verify Deployment Status

Monitor the deployment status:

```bash
# Check pod status
kubectl get pods -n redux-todo-astro

# Watch pods until they're running
kubectl get pods -n redux-todo-astro -w

# Once the pod is running, check detailed information
POD_NAME=$(kubectl get pods -n redux-todo-astro -l app=redux-todo-astro-dev -o jsonpath="{.items[0].metadata.name}")
kubectl describe pod $POD_NAME -n redux-todo-astro

# Check pod logs
kubectl logs $POD_NAME -n redux-todo-astro
```

### 6. Access the Application

Set up port forwarding to access the application:

```bash
# Port forward the service to access the application locally
kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80
```

Now you can access the application at [http://localhost:4323](http://localhost:4323)

## Managing Your Deployment

### Check Resource Usage

Monitor resource usage to ensure the application has adequate resources:

```bash
# If metrics-server is installed
kubectl top pods -n redux-todo-astro
```

### Update the Application

If you make changes to the application code:

```bash
# Restart the deployment to apply changes
kubectl rollout restart deployment/redux-todo-astro-dev -n redux-todo-astro

# Monitor the rollout status
kubectl rollout status deployment/redux-todo-astro-dev -n redux-todo-astro
```

### Scale the Application

To handle increased load, you can scale the application:

```bash
# Scale to more replicas
kubectl scale deployment redux-todo-astro-dev -n redux-todo-astro --replicas=2
```

### Troubleshooting Common Issues

#### Pod Not Starting

If the pod isn't starting properly:

```bash
# Check pod details
kubectl describe pod -l app=redux-todo-astro-dev -n redux-todo-astro

# Check pod logs (even if the pod hasn't started successfully)
kubectl logs -l app=redux-todo-astro-dev -n redux-todo-astro --previous
```

#### PersistentVolumeClaim Issues

If there are issues with the PersistentVolumeClaim:

```bash
# Check PVC status
kubectl get pvc -n redux-todo-astro

# Get detailed PVC information
kubectl describe pvc redux-todo-data-pvc -n redux-todo-astro
```

#### Service Connectivity Issues

If you cannot connect to the service:

```bash
# Check service
kubectl get service redux-todo-astro-dev-svc -n redux-todo-astro

# Check endpoints
kubectl get endpoints redux-todo-astro-dev-svc -n redux-todo-astro

# For Minikube, alternative way to access service
minikube service redux-todo-astro-dev-svc -n redux-todo-astro --url
```

#### ImagePullBackOff Issues

If pods are stuck in `ImagePullBackOff` state:

```bash
# Check the detailed pod status
kubectl describe pod -l app=redux-todo-astro-dev -n redux-todo-astro
```

This typically happens when Kubernetes can't find the Docker image. To resolve:

1. Verify the image exists locally:
   ```bash
   docker images | grep redux-todo-dev
   ```

2. For Kind clusters, load the image with the correct cluster name:
   ```bash
   kind load docker-image redux-todo-dev:latest --name your-cluster-name
   ```

3. Update deployment to use `imagePullPolicy: Never` for local images or `IfNotPresent` for mixed environments

4. Restart the deployment:
   ```bash
   kubectl rollout restart deployment/redux-todo-astro-dev -n redux-todo-astro
   ```

## Cleaning Up

To remove the deployment:

```bash
# Delete deployment
kubectl delete deployment redux-todo-astro-dev -n redux-todo-astro

# Delete service
kubectl delete service redux-todo-astro-dev-svc -n redux-todo-astro

# Delete PVC (Warning: This will delete persistent data)
kubectl delete pvc redux-todo-data-pvc -n redux-todo-astro

# Delete namespace (Optional - this will delete everything in the namespace)
kubectl delete namespace redux-todo-astro
```

## Automated Deployment

For a simplified deployment process, you can use the automated deployment script `fix-deployment.sh` which performs all necessary steps in sequence:

```bash
# Make the script executable if needed
chmod +x Kubernetes/fix-deployment.sh

# Run the deployment script
./Kubernetes/fix-deployment.sh
```

The script performs the following actions:
1. Builds the Docker image from Dockerfile.dev
2. Loads the image into your Kubernetes environment (auto-detects Minikube/Kind/k3d)
3. Applies the updated deployment and service configurations
4. Restarts the deployment to ensure it uses the new image
5. Sets up port forwarding for easy access

This is particularly useful for fixing ImagePullBackOff issues and ensuring a consistent deployment process.

## Important Notes

- The application is using the **`redux-todo-dev`** image which runs the Astro development server
- This approach provides full functionality with dynamic routes
- The development server requires more resources than a production server (~1GB memory)
- While not ideal for high-traffic production use, this is an effective workaround until the path-to-regexp errors in the production SSR build are resolved

## Appendix: Kubernetes Resource Details

### PersistentVolumeClaim (07-data-pvc.yaml)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redux-todo-data-pvc
  namespace: redux-todo-astro
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

### Deployment (09-dev-astro-deployment.yaml)
```yaml
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
```

### Service (10-dev-astro-service.yaml)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: redux-todo-astro-dev-svc
  namespace: redux-todo-astro
spec:
  selector:
    app: redux-todo-astro-dev
  ports:
  - port: 80
    targetPort: 4321
    protocol: TCP
    name: http
  type: ClusterIP
```

## References
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Astro Documentation](https://docs.astro.build/)
- [Redux Documentation](https://redux.js.org/)
