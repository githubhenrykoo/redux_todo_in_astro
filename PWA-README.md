# Progressive Web App (PWA) Implementation Guide

This document outlines how the PWA features are implemented in this Astro project.

## PWA Architecture

The PWA implementation consists of the following key components:

1. **Vite PWA Plugin for Astro**: Handles service worker generation and asset caching
2. **Web App Manifest**: Defines how the app appears when installed on a device
3. **PWA Icons**: Various sizes for different device requirements
4. **Offline Page**: Fallback when the user is offline
5. **Update Notification**: Component that notifies users when an app update is available
6. **Install Prompt**: Component that provides a custom install experience
7. **Network Status Monitoring**: Handles online/offline transitions

## Key Files

- `astro.config.mjs`: PWA configuration using @vite-pwa/astro
- `public/manifest.webmanifest`: Web app manifest file
- `public/pwa-*.png`: PWA icons in different sizes
- `src/pwa.js`: Main PWA initialization script
- `src/pages/offline.astro`: Offline fallback page
- `src/components/PwaUpdater.jsx`: Update notification component
- `src/components/InstallPwa.jsx`: Install prompt component

## Caching Strategy

The application uses a combined caching strategy:

- **Navigation routes**: Fall back to the offline page when offline
- **Static assets**: Cache-first strategy for app assets
- **Google Fonts**: Cache-first with 1-year expiration
- **API responses**: Network-first with fallback to cache (configured in service worker)

## How to Test PWA Features

1. **Install Testing**:
   - Open Chrome DevTools
   - Go to Application > Manifest to see if it's properly set up
   - Use the "Add to home screen" option to test installation

2. **Offline Testing**:
   - In Chrome DevTools, go to Network tab
   - Check "Offline" checkbox
   - Refresh the page to see the offline experience

3. **Update Testing**:
   - Make changes to the codebase
   - Run a new build
   - The update notification should appear when you refresh the page

## Customization

To customize the PWA behavior:

1. **Icons**: Replace the `pwa-*.png` files in the `public` directory with your own icons
2. **Manifest**: Edit `public/manifest.webmanifest` to change app name, colors, etc.
3. **Caching**: Modify the `workbox` section in `astro.config.mjs` to adjust caching behavior
4. **Offline Experience**: Modify `src/pages/offline.astro` to change the offline page

## Common Issues and Solutions

- **Service worker not updating**: Try clearing the Application > Storage in Chrome DevTools
- **Install banner not showing**: Make sure your app meets the [installability criteria](https://web.dev/install-criteria/)
- **Assets not caching properly**: Check the caching configuration in `astro.config.mjs`

## Resources

- [Vite PWA Plugin Documentation](https://vite-pwa-org.netlify.app/frameworks/astro.html)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest Documentation](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Checklist by Google](https://web.dev/pwa-checklist/)
