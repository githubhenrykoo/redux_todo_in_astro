# Redux Todo in Astro: Kubernetes & Docker Solution

## Working Image Details

**Image Name**: `redux_todo_in_astro-k8s-app`  
**Created From**: `Kubernetes/Dockerfile.k8s`  
**Status**: Successfully running with all issues fixed

## Issues Resolved

1. **Fixed Authentik Client Import Error**
   - Created a mock authentik client that prevents SSR import errors
   - The mock provides all required functions: `login`, `logout`, `getUserInfo`

2. **Created K8sTopBar Component**
   - Simplified alternative to TopBar that doesn't require authentik
   - Includes dark theme support with toggle functionality
   - Auto-enables dark theme on component mount

3. **Fixed WebSocket Connection Issues**
   - Properly configured HMR for WebSockets in Docker/Kubernetes
   - Used file polling for proper change detection in containers
   - Added correct volume mounts for live development

4. **Deployment Options**
   - Docker Compose: Use the configured `k8s-app` service
   - Kubernetes: The Docker image can be pushed and used directly

## Docker Compose Usage

```yaml
k8s-app:
  build:
    context: .
    dockerfile: Kubernetes/Dockerfile.k8s
  ports:
    - "4321:4321"
    - "24678:24678"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=4321
    - ASTRO_TELEMETRY_DISABLED=1
    - IS_KUBERNETES=true
    - THEME_DEFAULT=dark
  volumes:
    - .:/app
    - /app/node_modules
    - /app/.astro
  command: npm run dev -- --host 0.0.0.0 --watch.usePolling
  restart: unless-stopped
```

## Kubernetes Deployment

For Kubernetes deployment:

1. Build and tag the image:
   ```bash
   docker build -t your-registry/redux-todo-astro:latest -f Kubernetes/Dockerfile.k8s .
   ```

2. Push to a container registry:
   ```bash
   docker push your-registry/redux-todo-astro:latest
   ```

3. Update the Kubernetes manifests to use this image

## Additional Notes

The fixed image uses the development version of Astro with HMR. For production, you would need to:

1. Install an SSR adapter (e.g., Node.js adapter)
2. Build the application in production mode
3. Use the production image for deployment

This solution ensures that the Redux Todo application works correctly in both Docker and Kubernetes environments without any authentication-related errors.
