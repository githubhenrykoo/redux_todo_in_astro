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

    console.log('Running Division Algorithm Tests\n');

    for (const test of testCases) {
        console.log(`Testing ${test.name} - ${test.description}`);
        console.log(`Inputs: ${test.inputs.join(', ')}`);
        
        try {
            const result = await mcp.runAlgorithm(test.name, test.inputs);
            console.log('Success:', result.success);
            console.log('Output:', result.output);
            console.log(`Execution time: ${result.executionTime.toFixed(6)} seconds\n`);
        } catch (error) {
            console.error('Error:', error.message, '\n');
        }
    }
}

runTests();