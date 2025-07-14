const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Ollama API endpoint
const OLLAMA_API = 'http://127.0.0.1:11434/api';

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_API}/tags`);
    if (response.ok) {
      res.json({ status: 'ok', message: 'Ollama MCP Server is running and connected to Ollama' });
    } else {
      res.status(503).json({ 
        status: 'error', 
        message: 'Ollama service is not available' 
      });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Failed to connect to Ollama service' 
    });
  }
});

// Get available models
app.get('/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_API}/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models from Ollama');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message || 'Failed to fetch models' 
    });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { model, messages, stream = false } = req.body;
    
    const response = await fetch(`${OLLAMA_API}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: messages.filter(m => !m.isThinking),
        stream
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      error: error.message || 'Failed to process chat request' 
    });
  }
});

// Start server
const PORT = process.env.OLLAMA_PORT || 3003;
app.listen(PORT, () => {
  console.log(`Ollama MCP Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}/health to check server status`);
});