# Kubernetes Deployment Plan for Redux Todo in Astro

## Introduction

This document outlines the plan for deploying the Redux Todo in Astro application on Kubernetes. The application has already been containerized and published to Docker Hub, and this plan focuses on the Kubernetes resources and configurations needed for a successful deployment.

## Prerequisites

- Access to a Kubernetes cluster (local with minikube/kind or cloud provider)
- `kubectl` CLI tool installed and configured
- Docker image already published to Docker Hub
- Kubernetes namespace created for this application

## Kubernetes Resource Overview

The deployment will consist of the following Kubernetes resources:

1. **Namespace**: Isolated environment for the application
2. **ConfigMap**: Environment-specific configuration
3. **Secret**: Sensitive configuration (if needed)
4. **Deployment**: Application containers and replica management
5. **Service**: Internal network access to the application
6. **Ingress**: External access to the application
7. **HorizontalPodAutoscaler**: Automatic scaling based on resource usage
8. **PersistentVolumeClaim**: Storage for application data (if needed)

## Deployment Steps

### 1. Create Namespace

```bash
kubectl create namespace redux-todo-astro
kubectl config set-context --current --namespace=redux-todo-astro
```

### 2. Create ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redux-todo-astro-config
  namespace: redux-todo-astro
data:
  ASTRO_TELEMETRY_DISABLED: "1"
  NODE_ENV: "production"
  # Add other non-sensitive configuration values here
```

### 3. Create Secrets (if needed)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redux-todo-astro-secrets
  namespace: redux-todo-astro
type: Opaque
data:
  # Add base64-encoded secrets here
  # Example: API_KEY: <base64-encoded-value>
```

### 4. Create Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redux-todo-astro
  namespace: redux-todo-astro
  labels:
    app: redux-todo-astro
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redux-todo-astro
  template:
    metadata:
      labels:
        app: redux-todo-astro
    spec:
      containers:
      - name: redux-todo-astro
        image: <your-dockerhub-username>/redux-todo-astro:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /
            port: http
          initialDelaySeconds: 20
          periodSeconds: 15
        envFrom:
        - configMapRef:
            name: redux-todo-astro-config
        - secretRef:
            name: redux-todo-astro-secrets
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
```

### 5. Create Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redux-todo-astro
  namespace: redux-todo-astro
  labels:
    app: redux-todo-astro
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: redux-todo-astro
```

### 6. Create Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: redux-todo-astro
  namespace: redux-todo-astro
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    # Add other ingress controller specific annotations here
spec:
  ingressClassName: nginx
  rules:
  - host: todo.example.com  # Replace with your actual domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: redux-todo-astro
            port:
              number: 80
  # If you have TLS certificate
  # tls:
  # - hosts:
  #   - todo.example.com
  #   secretName: todo-tls-secret
```

### 7. Create HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: redux-todo-astro
  namespace: redux-todo-astro
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: redux-todo-astro
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

## Database Considerations

If your Redux Todo application uses SQLite as suggested by the memories, you'll need to handle persistence carefully in Kubernetes. Here are options:

1. **StatefulSet with PersistentVolumeClaim**:
   - If SQLite is needed for data persistence between restarts
   - Requires a PersistentVolumeClaim to store the database file

2. **In-memory Database**:
   - If data persistence is not critical or handled elsewhere

### PersistentVolumeClaim (if needed)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redux-todo-astro-data
  namespace: redux-todo-astro
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard  # Adjust based on your cluster's available storage classes
```

## Deployment Scripts

### All-in-one Application Deployment

Create a file called `deploy.sh`:

```bash
#!/bin/bash

# Apply all Kubernetes resources
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
kubectl apply -f kubernetes/hpa.yaml

# Wait for deployment to complete
kubectl rollout status deployment/redux-todo-astro -n redux-todo-astro

echo "Deployment completed. You can access the application at: http://todo.example.com"
```

### Monitoring & Testing Script

Create a file called `check-deployment.sh`:

```bash
#!/bin/bash

# Check pod status
echo "Pod status:"
kubectl get pods -n redux-todo-astro

# Check logs of the first pod
echo -e "\nApplication logs:"
POD_NAME=$(kubectl get pods -n redux-todo-astro -l app=redux-todo-astro -o jsonpath="{.items[0].metadata.name}")
kubectl logs $POD_NAME -n redux-todo-astro

# Test the application
echo -e "\nTesting application endpoint:"
kubectl run -i --rm --restart=Never curl-test --image=curlimages/curl -- curl -s http://redux-todo-astro.redux-todo-astro.svc.cluster.local
```

## Monitoring and Logging

For effective monitoring, consider:

1. **Prometheus** and **Grafana** for metrics collection and visualization
2. **Elasticsearch**, **Fluentd**, and **Kibana** (EFK) stack for logging
3. **Loki** with **Grafana** as a lightweight alternative for logging

### Prometheus ServiceMonitor (if Prometheus Operator is installed)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: redux-todo-astro
  namespace: redux-todo-astro
spec:
  selector:
    matchLabels:
      app: redux-todo-astro
  endpoints:
  - port: http
    interval: 15s
    path: /metrics
```

## Considerations for Production

1. **Resource Requirements**: Adjust CPU and memory requests/limits based on actual usage
2. **Scaling Strategy**: Modify the HPA settings according to the application's specific needs
3. **Security**: Implement network policies, pod security policies, and proper RBAC
4. **Backup & Restore**: Implement regular backup procedures if you're using persistent storage
5. **Rollout Strategy**: Use a proper deployment strategy (e.g., RollingUpdate with appropriate parameters)

## Next Steps and Future Improvements

1. Implement CI/CD pipeline integration with your Kubernetes deployment
2. Set up proper monitoring and alerting
3. Implement GitOps workflow using tools like ArgoCD or Flux
4. Consider using Helm charts for easier templating and deployment
5. Implement canary deployments or A/B testing capabilities

## Troubleshooting

Common issues and their resolutions:

1. **Image Pull Errors**: 
   - Verify Docker Hub credentials and repository permissions
   - Check that the image name and tag are correct

2. **Pod Startup Failures**:
   - Check pod events: `kubectl describe pod <pod-name> -n redux-todo-astro`
   - Check logs: `kubectl logs <pod-name> -n redux-todo-astro`

3. **Networking Issues**:
   - Verify service endpoints: `kubectl get endpoints redux-todo-astro -n redux-todo-astro`
   - Test connectivity within cluster: `kubectl exec -it <pod-name> -n redux-todo-astro -- curl http://redux-todo-astro:80`
