import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GasingMCP {
    constructor() {
        this.algorithms = {
            division1: {
                python: '/src/gasing/division/division1.py',
                description: 'Division by 1'
            },
            division2: {
                python: '/src/gasing/division/division2.py',
                description: 'Division by 2'
            },
            division4: {
                python: '/src/gasing/division/division4.py',
                description: 'Division by 4'
            },
            division5: {
                python: '/src/gasing/division/division5.py',
                description: 'Division by 5'
            },
            division8: {
                python: '/src/gasing/division/division8.py',
                description: 'Division by 8'
            },
            division10: {
                python: '/src/gasing/division/division10.py',
                description: 'Division by 10'
            },
            division100: {
                python: '/src/gasing/division/division100.py',
                description: 'Division by 100'
            }
        };
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

    async runAlgorithm(name, inputs = []) {
        const algorithm = this.algorithms[name];
        if (!algorithm) {
            throw new Error(`Algorithm '${name}' not found`);
        }

        const baseDir = '/Users/alessandrorumampuk/Documents/GitHub/redux_todo_in_astro';
        const filePath = path.join(baseDir, algorithm.python);
        
        const startTime = process.hrtime();

        try {
            const inputStr = inputs.join('\n');
            // Pass inputs as command line arguments for both division algorithms
            const args = (name === 'division1' || name === 'division2') 
                ? [filePath, ...inputs] 
                : [filePath];
            const { stdout } = await this.executeCommand('python3', args, {
                cwd: path.dirname(filePath)
            });

            const [seconds, nanoseconds] = process.hrtime(startTime);
            
            return {
                success: true,
                algorithm: name,
                description: algorithm.description,
                inputs,
                output: stdout.trim(),
                executionTime: seconds + nanoseconds / 1e9
            };
        } catch (error) {
            return {
                success: false,
                algorithm: name,
                description: algorithm.description,
                inputs,
                error: error.message
            };
        }
    }

    async compareAlgorithms(inputs = []) {
        const results = {};
        for (const [name, algo] of Object.entries(this.algorithms)) {
            results[name] = await this.runAlgorithm(name, inputs);
        }
        return results;
    }
}

export default GasingMCP;