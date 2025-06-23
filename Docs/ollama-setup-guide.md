# Ollama Setup Guide for Web Integration

This guide explains how to configure Ollama to work with web applications like our dashboard. By default, web browsers block connections from websites to local services (like Ollama) due to security restrictions called CORS (Cross-Origin Resource Sharing). This guide will show you how to enable CORS in Ollama to allow our web application to communicate with your local Ollama instance.

## Problem: CORS Errors

When accessing the chatbot from a website (like dev.pkc.pub), you might see this error:

```
Cannot connect to Ollama server. Make sure Ollama is running at http://127.0.0.1:11434
```

This happens because browsers block cross-origin requests to your local Ollama server for security reasons.

## Solution: Enable CORS in Ollama

### Option 1: Temporary Configuration (Command Line)

For a temporary solution (will reset when Ollama restarts):

1. Open Terminal
2. Stop any running Ollama instance:
   ```bash
   pkill ollama
   ```
3. Start Ollama with CORS enabled:
   ```bash
   OLLAMA_ORIGINS=* ollama serve
   ```
4. Keep this Terminal window open while using the application

This tells Ollama to accept connections from any origin, allowing websites to connect to it.

### Option 2: Permanent Configuration for Mac App Users

If you're using the official Ollama Mac application:

1. Quit the Ollama application if it's running
2. Open Terminal
3. Run this command to configure Ollama:
   ```bash
   defaults write com.ollama.Ollama OLLAMA_ORIGINS "*"
   ```
4. Restart the Ollama application

### Option 3: Permanent Configuration (Configuration File)

To make this change permanent for command-line Ollama:

1. Create or edit your Ollama environment file:
   ```bash
   # Create the directory if it doesn't exist
   mkdir -p ~/.ollama
   
   # Create/edit the .env file
   echo 'OLLAMA_ORIGINS=*' > ~/.ollama/.env
   ```
2. Restart Ollama:
   ```bash
   pkill ollama && ollama serve
   ```

## Usage Notes

Setting `OLLAMA_ORIGINS=*` allows any website to connect to your Ollama instance.

1. The `*` wildcard ensures all websites can access your Ollama API, which is the most convenient setup

2. Only enable CORS when you're actively using web applications with Ollama

3. When not using Ollama with web applications, you can optionally disable CORS:
   ```bash
   defaults delete com.ollama.Ollama OLLAMA_ORIGINS
   ```
   
4. This configuration is required for any web-based interface to work with your local Ollama installation

## Verifying It Works

After setting up CORS:

1. Make sure Ollama is running
2. Visit the dashboard at dev.pkc.pub or your local development server
3. Open the chatbot panel - it should connect to your local Ollama without errors
4. Try sending a message to verify the connection is working

If you still see connection errors, double check that:
- Ollama is running and responding (try `curl http://127.0.0.1:11434/api/tags` in terminal)
- You've correctly enabled CORS using one of the methods above
- Your browser isn't blocking the connection with extensions or settings

## Troubleshooting

If you're still having issues after enabling CORS:

1. **Check Ollama Status**: Ensure Ollama is running with `ps aux | grep ollama`
2. **Check CORS Configuration**: Verify with `defaults read com.ollama.Ollama OLLAMA_ORIGINS` (for Mac app)
3. **Browser Console**: Check your browser's developer console (F12) for specific error messages
4. **Firewall Issues**: Make sure your firewall isn't blocking connections to port 11434
5. **Restart Browser**: Sometimes a browser restart is needed after changing CORS settings

## For Developers

When developing applications that connect to Ollama, keep in mind:
- Always handle connection errors gracefully with clear user feedback
- Consider providing these instructions in your application's help section
- Test with CORS both enabled and disabled to ensure proper error handling
