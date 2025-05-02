import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GasingMCP {
    constructor() {
        // Initialize Express app
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json());
        
        // Updated algorithms to use both Rust and Python files
        this.algorithms = {
            division1: {
                rust: '/src/gasing/division/division1.rs',
                python: '/src/gasing/division/division1.py',
                javascript: '/src/gasing/division/division1.js',
                description: 'Division by 1'
            },
            division2: {
                rust: '/src/gasing/division/division2.rs',
                python: '/src/gasing/division/division2.py',
                javascript: '/src/gasing/division/division2.js',
                description: 'Division by 2'
            },
            division4: {
                rust: '/src/gasing/division/division4.rs',
                python: '/src/gasing/division/division4.py',
                javascript: '/src/gasing/division/division4.js',
                description: 'Division by 4'
            },
            division5: {
                rust: '/src/gasing/division/division5.rs',
                python: '/src/gasing/division/division5.py',
                javascript: '/src/gasing/division/division5.js',
                description: 'Division by 5'
            },
            division8: {
                rust: '/src/gasing/division/division8.rs',
                python: '/src/gasing/division/division8.py',
                javascript: '/src/gasing/division/division8.js',
                description: 'Division by 8'
            },
            division10: {
                rust: '/src/gasing/division/division10.rs',
                python: '/src/gasing/division/division10.py',
                javascript: '/src/gasing/division/division10.js',
                description: 'Division by 10'
            },
            division100: {
                rust: '/src/gasing/division/division100.rs',
                python: '/src/gasing/division/division100.py',
                javascript: '/src/gasing/division/division100.js',
                description: 'Division by 100'
            }
        };
        
        // Set up API routes
        this.setupRoutes();
    }
    
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                message: 'Gasing MCP Server is running' 
            });
        });
        
        // Get available algorithms
        this.app.get('/algorithms', (req, res) => {
            const algorithmList = Object.entries(this.algorithms).map(([name, algo]) => ({
                name,
                description: algo.description
            }));
            
            res.json({ algorithms: algorithmList });
        });
        
        // Run algorithm endpoint
        this.app.post('/run', async (req, res) => {
            try {
                const { algorithm, inputs, language } = req.body;  // Add language parameter here
                
                if (!algorithm) {
                    return res.status(400).json({ 
                        error: 'Algorithm name is required' 
                    });
                }
                
                const result = await this.runAlgorithm(algorithm, inputs || [], language || 'rust');  // Pass language parameter
                res.json(result);
            } catch (error) {
                res.status(500).json({ 
                    error: error.message || 'Failed to process request' 
                });
            }
        });
        
        // Compare algorithms endpoint
        this.app.post('/compare', async (req, res) => {
            try {
                const { inputs } = req.body;
                const results = await this.compareAlgorithms(inputs || []);
                res.json(results);
            } catch (error) {
                res.status(500).json({ 
                    error: error.message || 'Failed to compare algorithms' 
                });
            }
        });
    }

    async executeCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, options);
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', data => stdout += data.toString());
            process.stderr.on('data', data => stderr += data.toString());
            
            process.stdin.on('error', () => {});
            
            process.on('close', code => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Process failed with code ${code}: ${stderr}`));
                }
            });

            // Handle input if provided
            if (options.input) {
                process.stdin.write(options.input);
                process.stdin.end();
            }
        });
    }

    async runAlgorithm(name, inputs = [], language = 'rust') {
        const algorithm = this.algorithms[name];
        if (!algorithm) {
            throw new Error(`Algorithm '${name}' not found`);
        }

        const baseDir = '/Users/alessandrorumampuk/Documents/GitHub/redux_todo_in_astro';
        const filePath = path.join(baseDir, algorithm[language]);
        
        if (!algorithm[language]) {
            throw new Error(`Language '${language}' not supported for algorithm '${name}'`);
        }
        
        const startTime = process.hrtime();
        
        try {
            let stdout = '';
            
            switch (language) {
                case 'rust':
                    // First compile the Rust file
                    const rustcArgs = [filePath, '-o', `${path.dirname(filePath)}/${name}_exec`];
                    await this.executeCommand('rustc', rustcArgs, {
                        cwd: path.dirname(filePath)
                    });
                    
                    // Then run the compiled executable
                    const rustResult = await this.executeCommand(`${path.dirname(filePath)}/${name}_exec`, [], {
                        cwd: path.dirname(filePath)
                    });
                    stdout = rustResult.stdout;
                    break;

                case 'python':
                    // Run the Python file directly
                    const pythonResult = await this.executeCommand('python3', [filePath], {
                        cwd: path.dirname(filePath)
                    });
                    stdout = pythonResult.stdout;
                    break;

                case 'javascript':
                    // Run the JavaScript file with Node.js
                    const jsResult = await this.executeCommand('node', [filePath], {
                        cwd: path.dirname(filePath)
                    });
                    stdout = jsResult.stdout;
                    break;

                default:
                    throw new Error(`Unsupported language: ${language}`);
            }

            const [seconds, nanoseconds] = process.hrtime(startTime);
            
            return {
                success: true,
                algorithm: name,
                description: algorithm.description,
                language,
                inputs,
                output: stdout.trim(),
                executionTime: seconds + nanoseconds / 1e9
            };
        } catch (error) {
            return {
                success: false,
                algorithm: name,
                description: algorithm.description,
                language,
                inputs,
                error: error.message
            };
        }
    }

    async compareAlgorithms(inputs = [], language = 'rust') {
        const results = {};
        for (const [name, algo] of Object.entries(this.algorithms)) {
            results[name] = await this.runAlgorithm(name, inputs, language);
        }
        return results;
    }
    
    // Start the server
    start(port = 3004) {
        this.app.listen(port, () => {
            console.log(`Gasing MCP Server running on port ${port}`);
            console.log(`Visit http://localhost:${port}/health to check server status`);
        });
    }
}

// Create and start the server when this file is run directly
if (import.meta.url === `file://${__filename}`) {
    const server = new GasingMCP();
    const PORT = process.env.GASING_PORT || 3004;
    server.start(PORT);
}

export default GasingMCP;