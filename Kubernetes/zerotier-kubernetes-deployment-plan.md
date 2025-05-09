# Distributed Kubernetes Deployment Plan with ZeroTier

## Overview

This plan outlines the steps to set up a distributed Kubernetes cluster across multiple physical machines (including your EC2 instances) using ZeroTier as the networking layer. This approach allows you to create a single Kubernetes cluster with nodes in different networks, data centers, or even geographic regions.

## Phase 1: ZeroTier Network Setup

### Step 1: Create ZeroTier Network
1. Create an account at [my.zerotier.com](https://my.zerotier.com/)
2. Create a new network
3. Note your Network ID (a 16-character hexadecimal string)
4. Configure network settings:
   - Set to PRIVATE
   - Enable Auto-Assign from range (e.g., 10.144.0.0/16)
   - Configure flow rules if needed for additional security

### Step 2: Install ZeroTier on All Machines

**For each machine (including your EC2 instances):**

```bash
# For Ubuntu/Debian systems
curl -s https://install.zerotier.com | sudo bash

# Start ZeroTier service
sudo systemctl enable zerotier-one
sudo systemctl start zerotier-one

# Join your network
sudo zerotier-cli join <your-network-id>
```

### Step 3: Authorize Nodes in ZeroTier

1. Go to your ZeroTier Central network page
2. Find the nodes that have joined
3. Check the "Auth" checkbox for each node
4. Note the assigned ZeroTier IPs for each machine

### Step 4: Test ZeroTier Connectivity

On each node, ping the other nodes using their ZeroTier IPs to verify connectivity:

```bash
ping <zerotier-ip-of-other-machine>
```

## Phase 2: Kubernetes Cluster Setup

### Step 1: Prepare All Machines

**On all nodes:**

1. Disable swap:
   ```bash
   sudo swapoff -a
   sudo sed -i '/ swap / s/^/#/' /etc/fstab
   ```

2. Load required kernel modules:
   ```bash
   cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
   overlay
   br_netfilter
   EOF
   
   sudo modprobe overlay
   sudo modprobe br_netfilter
   ```

3. Set network parameters:
   ```bash
   cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
   net.bridge.bridge-nf-call-iptables  = 1
   net.bridge.bridge-nf-call-ip6tables = 1
   net.ipv4.ip_forward                 = 1
   EOF
   
   sudo sysctl --system
   ```

### Step 2: Install Container Runtime

**On all nodes:**

1. Install containerd:
   ```bash
   sudo apt-get update
   sudo apt-get install -y containerd.io
   ```

2. Configure containerd:
   ```bash
   sudo mkdir -p /etc/containerd
   containerd config default | sudo tee /etc/containerd/config.toml
   sudo sed -i 's/SystemdCgroup \= false/SystemdCgroup \= true/g' /etc/containerd/config.toml
   sudo systemctl restart containerd
   ```

### Step 3: Install Kubernetes Components

**On all nodes:**

1. Add Kubernetes repository:
   ```bash
   sudo apt-get update
   sudo apt-get install -y apt-transport-https ca-certificates curl
   curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
   echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
   ```

2. Install kubelet, kubeadm, and kubectl:
   ```bash
   sudo apt-get update
   sudo apt-get install -y kubelet kubeadm kubectl
   sudo apt-mark hold kubelet kubeadm kubectl
   ```

### Step 4: Initialize Control Plane

**Choose one machine as the control plane** (preferably the Singapore t2.medium instance):

1. Initialize the Kubernetes cluster:
   ```bash
   sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=<zerotier-ip-of-control-plane>
   ```

2. Set up kubeconfig:
   ```bash
   mkdir -p $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   ```

### Step 5: Install CNI Plugin

**On the control plane node:**

1. Apply Flannel CNI:
   ```bash
   kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
   ```

### Step 6: Join Worker Nodes

**On each worker node** (your other EC2 instances), run the join command provided by the control plane initialization:

```bash
sudo kubeadm join <zerotier-ip-of-control-plane>:6443 --token <token> --discovery-token-ca-cert-hash <hash>
```

### Step 7: Verify Cluster

**On the control plane:**

1. Check nodes:
   ```bash
   kubectl get nodes
   ```

2. Verify system pods:
   ```bash
   kubectl get pods -n kube-system
   ```

## Phase 3: EC2 Instance-Specific Configuration

Based on your EC2 instances:

### Singapore Instances (ap-southeast-1)

1. **Instance 1**: i-0b2b1328ab09412eb (47.129.181.59)
   - Role: Kubernetes Control Plane
   - Type: t2.medium (2 vCPU, 4GB RAM)
   - ZeroTier IP: Will be assigned after joining network

2. **Instance 2**: i-0048c5bbc329b63ff (13.212.215.242)
   - Role: Kubernetes Worker Node
   - Type: t2.medium (2 vCPU, 4GB RAM)
   - ZeroTier IP: Will be assigned after joining network

### Jakarta Instance (ap-southeast-3)

1. **Instance 3**: i-0234a65adce65a8db (16.78.212.245)
   - Role: Kubernetes Worker Node
   - Type: t3.small (2 vCPU, 2GB RAM)
   - ZeroTier IP: Will be assigned after joining network

### Security Group Configuration

Ensure the following ports are open in EC2 security groups:

1. ZeroTier: UDP port 9993
2. Kubernetes API: TCP port 6443
3. Kubelet: TCP port 10250
4. NodePort services: TCP ports 30000-32767

## Phase 4: Deploy Redux Todo in Astro

### Step 1: Build and Distribute Docker Images

Since your cluster spans multiple physical machines, ensure each worker node has the Redux Todo Dev image:

1. On each node, build the image:
   ```bash
   # Clone repository if needed
   git clone https://github.com/githubhenrykoo/redux_todo_in_astro.git
   cd redux_todo_in_astro
   
   # Build Docker image
   docker build -t redux-todo-dev:latest -f Kubernetes/Dockerfile.dev .
   ```

### Step 2: Deploy Application

From the control plane node:

1. Create namespace:
   ```bash
   kubectl create namespace redux-todo-astro
   ```

2. Apply PVC for data persistence:
   ```bash
   kubectl apply -f kubernetes-manifests/07-data-pvc.yaml
   ```

3. Apply deployment:
   ```bash
   kubectl apply -f kubernetes-manifests/09-dev-astro-deployment.yaml
   ```

4. Apply service:
   ```bash
   kubectl apply -f kubernetes-manifests/10-dev-astro-service.yaml
   ```

### Step 3: Access Application

Set up port forwarding to access the application:

```bash
kubectl port-forward service/redux-todo-astro-dev-svc -n redux-todo-astro 4323:80
```

Then access at: http://localhost:4323

## Phase 5: Advanced Configuration

### Pod Placement Strategy

You can use node affinity to control pod placement across your distributed nodes:

1. Label nodes with zones:
   ```bash
   kubectl label nodes <singapore-node-1> topology.kubernetes.io/zone=sg1
   kubectl label nodes <singapore-node-2> topology.kubernetes.io/zone=sg2
   kubectl label nodes <jakarta-node> topology.kubernetes.io/zone=jkt
   ```

2. Update deployment with node affinity:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   # ...
   spec:
     # ...
     template:
       spec:
         affinity:
           nodeAffinity:
             preferredDuringSchedulingIgnoredDuringExecution:
             - weight: 1
               preference:
                 matchExpressions:
                 - key: topology.kubernetes.io/zone
                   operator: In
                   values:
                   - sg1
                   - sg2
         # ...
   ```

### Network Policies

Create network policies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: redux-todo-allow-internal
  namespace: redux-todo-astro
spec:
  podSelector:
    matchLabels:
      app: redux-todo-astro-dev
  ingress:
  - from:
    - podSelector: {}
```

## Troubleshooting Guide

### Network Connectivity Issues

1. Check ZeroTier status:
   ```bash
   sudo zerotier-cli info
   sudo zerotier-cli listpeers
   ```

2. Verify ZeroTier IP assignment:
   ```bash
   sudo zerotier-cli listnetworks
   ```

3. Test connectivity between nodes:
   ```bash
   ping <zerotier-ip>
   ```

### Kubernetes API Server Issues

1. Check API server accessibility:
   ```bash
   curl -k https://<zerotier-ip-of-control-plane>:6443
   ```

2. Verify kubelet status:
   ```bash
   sudo systemctl status kubelet
   journalctl -xeu kubelet
   ```

### Pod Scheduling Issues

1. Check node readiness:
   ```bash
   kubectl get nodes
   kubectl describe node <node-name>
   ```

2. Verify pod status:
   ```bash
   kubectl get pods -n redux-todo-astro
   kubectl describe pod <pod-name> -n redux-todo-astro
   ```

## Maintenance Procedures

### Adding New Nodes

1. Install ZeroTier and join network
2. Authorize node in ZeroTier Central
3. Prepare node (swap, kernel modules, etc.)
4. Install container runtime and Kubernetes components
5. Get a new join token if needed:
   ```bash
   kubeadm token create --print-join-command
   ```
6. Join the cluster with the token

### Removing Nodes

1. Drain the node:
   ```bash
   kubectl drain <node-name> --ignore-daemonsets
   ```
2. Delete the node:
   ```bash
   kubectl delete node <node-name>
   ```
3. Reset Kubernetes on the node:
   ```bash
   sudo kubeadm reset
   ```

### Cluster Backup

1. Backup etcd:
   ```bash
   sudo -u etcd etcdctl snapshot save /tmp/etcd-backup.db
   ```

## Security Considerations

1. **ZeroTier Security**:
   - Keep your ZeroTier network private
   - Use flow rules to limit traffic
   - Regularly audit authorized devices

2. **Kubernetes Security**:
   - Implement RBAC for cluster access
   - Use Network Policies to restrict pod communication
   - Consider encrypting etcd data

3. **EC2 Security**:
   - Keep security groups restricted
   - Regularly update instances
   - Use IAM roles with minimal permissions

## Next Steps

1. Implement monitoring with Prometheus and Grafana
2. Set up logging with Elasticsearch, Fluentd, and Kibana (EFK)
3. Configure automated backups for etcd and application data
4. Implement CI/CD pipeline integration
