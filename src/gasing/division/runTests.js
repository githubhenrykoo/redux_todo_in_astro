import GasingMCP from './GasingMCP.js';

async function runTests() {
    const mcp = new GasingMCP();
    
    const testCases = [
        {
            name: 'division1',
            inputs: ['54321', '1'],
            description: 'Division by 1'
        },
        {
            name: 'division2',
            inputs: ['54321', '2'],
            description: 'Division by 2'
        },
        {
            name: 'division4',
            inputs: ['54321', '4'],
            description: 'Division by 4'
        },
        {
            name: 'division5',
            inputs: ['54321', '5'],
            description: 'Division by 5'
        },
        {
            name: 'division8',
            inputs: ['54321', '8'],
            description: 'Division by 8'
        },
        {
            name: 'division10',
            inputs: ['54321', '10'],
            description: 'Division by 10'
        },
        {
            name: 'division100',
            inputs: ['54321', '100'],
            description: 'Division by 100'
        }
    ];

    // Run Rust tests
    console.log('Running Rust Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'rust');
    
    // Run Python tests
    console.log('\n\nRunning Python Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'python');
    
    // Run JavaScript tests
    console.log('\n\nRunning JavaScript Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'javascript');
    
    // Compare all languages
    console.log('\n\nComparing Language Performance\n');
    await compareLanguages(mcp, testCases);
}

async function runLanguageTests(mcp, testCases, language) {
    for (const test of testCases) {
        console.log(`Testing ${test.name} - ${test.description}`);
        console.log(`Inputs: ${test.inputs.join(', ')}`);
        
        try {
            const result = await mcp.runAlgorithm(test.name, test.inputs, language);
            console.log('Success:', result.success);
            console.log('Output:', result.output);
            console.log(`Execution time: ${result.executionTime.toFixed(6)} seconds\n`);
        } catch (error) {
            console.error('Error:', error.message, '\n');
        }
    }
}

async function compareLanguages(mcp, testCases) {
    const results = {
        rust: {},
        python: {},
        javascript: {}
    };
    
    // Collect all results
    for (const test of testCases) {
        try {
            results.rust[test.name] = await mcp.runAlgorithm(test.name, test.inputs, 'rust');
            results.python[test.name] = await mcp.runAlgorithm(test.name, test.inputs, 'python');
            results.javascript[test.name] = await mcp.runAlgorithm(test.name, test.inputs, 'javascript');
        } catch (error) {
            console.error(`Error comparing ${test.name}:`, error.message);
        }
    }
    
    // Display comparison
    console.log('Algorithm | Rust Time (s) | Python Time (s) | JS Time (s) | Rust/Python | Rust/JS | Python/JS');
    console.log('----------|--------------|----------------|-------------|------------|---------|----------');
    
    for (const test of testCases) {
        const rustResult = results.rust[test.name];
        const pythonResult = results.python[test.name];
        const jsResult = results.javascript[test.name];
        
        if (rustResult?.success && pythonResult?.success && jsResult?.success) {
            const rustTime = rustResult.executionTime;
            const pythonTime = pythonResult.executionTime;
            const jsTime = jsResult.executionTime;
            const rustPythonRatio = (rustTime / pythonTime).toFixed(2);
            const rustJsRatio = (rustTime / jsTime).toFixed(2);
            const pythonJsRatio = (pythonTime / jsTime).toFixed(2);
            
            console.log(
                `${test.name.padEnd(10)} | ` +
                `${rustTime.toFixed(6).padEnd(14)} | ` +
                `${pythonTime.toFixed(6).padEnd(16)} | ` +
                `${jsTime.toFixed(6).padEnd(13)} | ` +
                `${rustPythonRatio.padEnd(12)} | ` +
                `${rustJsRatio.padEnd(9)} | ` +
                pythonJsRatio
            );
        } else {
            console.log(`${test.name.padEnd(10)} | Error: Could not compare`);
        }
    }
}

runTests();
import GasingMCP from './GasingMCP.js';

async function runTests() {
    const mcp = new GasingMCP();
    
    const testCases = [
        {
            name: 'division1',
            inputs: ['54321', '1'],
            description: 'Division by 1'
        },
        {
            name: 'division2',
            inputs: ['54321', '2'],
            description: 'Division by 2'
        },
        {
            name: 'division4',
            inputs: ['54321', '4'],
            description: 'Division by 4'
        },
        {
            name: 'division5',
            inputs: ['54321', '5'],
            description: 'Division by 5'
        },
        {
            name: 'division8',
            inputs: ['54321', '8'],
            description: 'Division by 8'
        },
        {
            name: 'division10',
            inputs: ['54321', '10'],
            description: 'Division by 10'
        },
        {
            name: 'division100',
            inputs: ['54321', '100'],
            description: 'Division by 100'
        }
    ];

    // Run Rust tests
    console.log('Running Rust Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'rust');
    
    // Run Python tests
    console.log('\n\nRunning Python Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'python');
    
    // Run JavaScript tests
    console.log('\n\nRunning JavaScript Division Algorithm Tests\n');
    await runLanguageTests(mcp, testCases, 'javascript');
    
    // Compare all languages
    console.log('\n\nComparing Language Performance\n');
    await compareLanguages(mcp, testCases);
}

async function runLanguageTests(mcp, testCases, language) {
    for (const test of testCases) {
        console.log(`Testing ${test.name} - ${test.description}`);
        console.log(`Inputs: ${test.inputs.join(', ')}`);
        
        try {
            const result = await mcp.runAlgorithm(test.name, test.inputs, language);
            console.log('Success:', result.success);
            console.log('Output:', result.output);
            console.log(`Execution time: ${result.executionTime.toFixed(6)} seconds\n`);
        } catch (error) {
            console.error('Error:', error.message, '\n');
        }
    }
}

async function compareLanguages(mcp, testCases) {
    const results = {
        rust: {},
        python: {}
    };
    
    // Collect all results
    for (const test of testCases) {
        try {
            results.rust[test.name] = await mcp.runAlgorithm(test.name, test.inputs, 'rust');
            results.python[test.name] = await mcp.runAlgorithm(test.name, test.inputs, 'python');
        } catch (error) {
            console.error(`Error comparing ${test.name}:`, error.message);
        }
    }
    
    // Display comparison
    console.log('Algorithm | Rust Time (s) | Python Time (s) | Ratio (Rust/Python)');
    console.log('----------|--------------|----------------|-------------------');
    
    for (const test of testCases) {
        const rustResult = results.rust[test.name];
        const pythonResult = results.python[test.name];
        
        if (rustResult?.success && pythonResult?.success) {
            const rustTime = rustResult.executionTime;
            const pythonTime = pythonResult.executionTime;
            const ratio = (rustTime / pythonTime).toFixed(2);
            
            console.log(`${test.name.padEnd(10)} | ${rustTime.toFixed(6).padEnd(14)} | ${pythonTime.toFixed(6).padEnd(16)} | ${ratio}`);
        } else {
            console.log(`${test.name.padEnd(10)} | Error: Could not compare`);
        }
    }
}

runTests();