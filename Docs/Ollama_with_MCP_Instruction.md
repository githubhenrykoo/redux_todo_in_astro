# Ollama Local LLM with MCP

### 1. Download Ollama: https://ollama.com/download
### 2. Pull LLM: ollama pull mistral
### 3. Ensure Ollama is running: ollama serve
### 4. Download Go Programming Language: https://go.dev/doc/install
### 5. Install MCP Host via terminal: go install github.com/mark3labs/mcphost@latest
### 6. Create file "mcp.json" in "/Users/${username}/Documents/MCP/demo.json":

```
{
    "mcpServers": {
      "filesystem": {
        "type": "local",
        "command": "npx",
        "args": [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "./"
        ],
        "environment": {
          "ALLOWED_DIRS": "/Users/alessandrorumampuk/Downloads",
          "DEBUG": "true"
        },
        "allowedTools": ["code", "docs"]
      },
      "google-maps": {
        "command": "docker",
        "args": [
          "run",
          "-i",
          "--rm",
          "-e",
          "GOOGLE_MAPS_API_KEY",
          "mcp/google-maps"
        ],
        "environment": {
          "GOOGLE_MAPS_API_KEY": "${GOOGLE_MAPS_API_KEY}"
        }
      }
    }
  }
```

### 7. Run Ollama with MCP via command:

```
export PATH="$HOME/go/bin:$PATH" && mcphost -m ollama:mistral --config "/Users/${username}/Documents/MCP/demo.json"
```
