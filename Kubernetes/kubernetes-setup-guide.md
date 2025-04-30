# Kubernetes Deployment Guide for Redux Todo in Astro

This document provides a comprehensive guide on how we deployed the Redux Todo in Astro application to Kubernetes, addressing the path-to-regexp error in SSR mode by using the development server approach.

## Overview

After encountering persistent issues with the Astro SSR production build (`path-to-regexp` errors), we implemented a successful solution by:

1. Creating a development-focused Docker image
2. Deploying it to Kubernetes with adequate resources
3. Setting up the necessary Kubernetes resources (Deployment, PVC, Service)

## Docker Images

We tried several Docker image approaches:

| Image Name | Description | Status |
|------------|-------------|--------|
| `henry768/redux_todo_in_astro:latest` | Default SSR production build | ❌ Failed with path-to-regexp error |
| `henry768/redux_todo_in_astro:sha-a568296a894538f2c551df25c89544f98fc4dbc8` | Specific SHA tag | ❌ Failed with path-to-regexp error |
| `redux-todo-complete` | Static file server | ✅ Works but limited functionality (no dynamic routes) |
| `redux-todo-dev` | Development server | ✅ Works with full functionality |

## Final Solution: Development Server Approach

### 1. Development Dockerfile

We created a specialized Dockerfile (`Dockerfile.dev`) that runs the Astro development server:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules including SQLite
RUN apk add --no-cache python3 make g++ python3-dev py3-setuptools sqlite sqlite-dev

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Create development image
FROM base AS dev-runner
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create a lightweight user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 astro && \
    chown -R astro:nodejs /app

# Switch to non-root user
USER astro

# Expose port (Astro dev server)
EXPOSE 4321

# Environment variables
ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=4321
ENV ASTRO_TELEMETRY_DISABLED=1

# Start the development server
CMD ["npm", "run", "dev"]
```

### 2. Kubernetes Configuration Files

#### Deployment (09-dev-astro-deployment.yaml)

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

#### PersistentVolumeClaim (07-data-pvc.yaml)

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

#### Service (10-dev-astro-service.yaml)

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

## Step-by-Step Deployment Process

### 1. Build the Development Docker Image

```bash
# Build the development image
docker build -t redux-todo-dev -f Kubernetes/Dockerfile.dev .

# Test locally (optional)
docker run -d -p 4322:4321 --name redux-todo-dev-test redux-todo-dev
```

### 2. Load the Image into Minikube

```bash
# Load the image into Minikube
minikube image load redux-todo-dev
```

### 3. Create Kubernetes Resources

```bash
# Create PersistentVolumeClaim
kubectl apply -f Kubernetes/kubernetes-manifests/07-data-pvc.yaml

# Create Deployment
kubectl apply -f Kubernetes/kubernetes-manifests/09-dev-astro-deployment.yaml

# Create Service
kubectl apply -f Kubernetes/kubernetes-manifests/10-dev-astro-service.yaml
```

### 4. Access the Application

```bash
# Set up port forwarding
kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80

# Now access the application at http://localhost:4323
```

## Managing Your Deployment

### Check Deployment Status

```bash
# Check all pods in the namespace
kubectl get pods -n redux-todo-astro

# Check detailed pod information
kubectl describe pod <pod-name> -n redux-todo-astro

# View pod logs
kubectl logs <pod-name> -n redux-todo-astro
```

### Update the Deployment

If you make changes to your application:

```bash
# Rebuild the image
docker build -t redux-todo-dev -f Kubernetes/Dockerfile.dev .

# Load it into Minikube
minikube image load redux-todo-dev

# Restart the deployment
kubectl rollout restart deployment/redux-todo-astro-dev -n redux-todo-astro
```

## Key Insights

- **Development vs. Production:** The Astro development server uses a different routing mechanism than the production SSR build, which is why it doesn't encounter the path-to-regexp error.
- **Resource Requirements:** The development server requires more resources (~1GB memory) than a typical production server.
- **Advantages:** This approach provides the full application functionality, including dynamic routes like `/resizablepage`.
- **Limitations:** While not ideal for production, this is an effective workaround until the path-to-regexp error in the production SSR build is resolved.

## Alternative Approaches

- **Static Server:** For a more production-ready solution, the `redux-todo-complete` image with the static file server approach could be used, though it may have limitations with dynamic routes.
- **Fix SSR Issues:** Investigate and fix the path-to-regexp error in the production SSR build for a more robust long-term solution.
