#!/bin/bash
set -e

# Create a simple local Kubernetes setup using kubectl directly
echo "Setting up a simplified Kubernetes demonstration environment..."

# Create the namespace
echo "Creating namespace..."
kubectl create namespace redux-todo-astro 2>/dev/null || echo "Namespace already exists"

# Apply the manifests without requiring Docker
echo "Creating sample Kubernetes resources..."

# Apply the PVC
kubectl apply -f kubernetes-manifests/07-data-pvc.yaml

# Create a ConfigMap with a sample configuration
cat << EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: redux-todo-config
  namespace: redux-todo-astro
data:
  APP_ENV: "development"
  NODE_ENV: "development"
  HOST: "0.0.0.0"
  PORT: "4321"
EOF

# Create a sample deployment that uses a public image
cat << EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redux-todo-sample
  namespace: redux-todo-astro
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redux-todo-sample
  template:
    metadata:
      labels:
        app: redux-todo-sample
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
        volumeMounts:
        - name: config-volume
          mountPath: /etc/nginx/conf.d
      volumes:
      - name: config-volume
        configMap:
          name: redux-todo-config
EOF

# Create a service
cat << EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: redux-todo-sample-svc
  namespace: redux-todo-astro
spec:
  selector:
    app: redux-todo-sample
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  type: ClusterIP
EOF

echo "Creating a monitoring job to demonstrate Kubernetes Jobs..."
cat << EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: demo-job
  namespace: redux-todo-astro
spec:
  template:
    spec:
      containers:
      - name: demo
        image: busybox:1.28
        command: ['sh', '-c', 'echo "Checking system..." && sleep 5 && echo "Demo job complete"']
      restartPolicy: Never
  backoffLimit: 4
EOF

echo "Creating a CronJob for scheduled tasks..."
cat << EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: demo-cronjob
  namespace: redux-todo-astro
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: demo-cron
            image: busybox:1.28
            command: ['sh', '-c', 'echo "Running scheduled task $(date)"; sleep 5']
          restartPolicy: OnFailure
  suspend: true
EOF

echo "Resources created successfully! Here's what's running in your namespace:"
kubectl get all -n redux-todo-astro

echo ""
echo "To see details of the deployment:"
echo "kubectl describe deployment redux-todo-sample -n redux-todo-astro"
echo ""
echo "To see logs of a pod:"
echo "kubectl logs <pod-name> -n redux-todo-astro"
echo ""
echo "To port-forward the service to your local machine:"
echo "kubectl port-forward service/redux-todo-sample-svc -n redux-todo-astro 8080:80"
echo ""
echo "This is a simplified setup to demonstrate Kubernetes concepts while Docker issues are resolved."
