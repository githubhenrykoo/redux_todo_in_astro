/**
 * Gasing Addition: Digit-wise carry detection with step-by-step logging.
 * JavaScript implementation using BigInt for handling arbitrary size numbers.
 */

/**
 * Detects carries for each digit position following the Gasing logic.
 * Returns an array of 0/1 flags for each position.
 * @param {string} a_str First number as string
 * @param {string} b_str Second number as string
 * @returns {Array<number>} Array of carry flags (0 or 1) for each position
 */
function carryDetection(a_str, b_str) {
  // Pad to same length
  const max_len = Math.max(a_str.length, b_str.length);
  a_str = a_str.padStart(max_len, '0');
  b_str = b_str.padStart(max_len, '0');
  
  // Convert strings to arrays of digits
  const A = a_str.split('').map(Number);
  const B = b_str.split('').map(Number);
  const carry = Array(max_len).fill(0);
  
  console.log(`Padded A: ${a_str}, B: ${b_str}\n`);
  
  for (let i = 0; i < max_len; i++) {
    const s = A[i] + B[i];
    console.log(`Position ${i+1}: A=${A[i]}, B=${B[i]}, sum=${s}`);
    
    if (s < 9) {
      console.log("  sum < 9: no carry");
    } else if (s > 9) {
      console.log("  sum > 9: immediate carry");
      carry[i] = 1;
    } else { // s == 9
      console.log("  sum == 9: ambiguous, performing lookahead");
      let j = i + 1;
      // lookahead through consecutive 9-sums
      while (j < max_len && (A[j] + B[j]) === 9) {
        console.log(`    lookahead at pos ${j+1}: sum == 9, continue`);
        j++;
      }
      
      if (j < max_len && (A[j] + B[j]) > 9) {
        console.log(`    lookahead found sum > 9 at pos ${j+1}: carry retroactive to pos ${i+1}`);
        carry[i] = 1;
      } else {
        if (j < max_len) {
          console.log(`    lookahead found sum < 9 (${A[j]+B[j]}) at pos ${j+1}: no carry`);
        } else {
          console.log("    reached end with all 9s: no carry");
        }
      }
    }
    console.log();
  }
  
  return carry;
}

/**
 * Process the addition and return comprehensive results including carry flags and metrics.
 * @param {string} a_str First number as string
 * @param {string} b_str Second number as string
 * @returns {Object} Results including carry flags, sum, and computation metrics
 */
function processAddition(a_str, b_str) {
  const startTime = performance.now();
  const operationMetrics = {
    digitComparisons: 0,
    lookaheadSteps: 0,
    memoryBytes: 0
  };
  
  // Store console.log to capture the logs
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    logs.push(args.join(' '));
    // Uncomment the next line if you want to see the logs during development
    // originalLog(...args);
  };
  
  // Run the carry detection with metrics tracking
  const carry = carryDetection(a_str, b_str);
  
  // Count lookahead steps by analyzing logs
  operationMetrics.lookaheadSteps = logs.filter(log => log.includes('lookahead')).length;
  operationMetrics.digitComparisons = logs.filter(log => log.includes('Position')).length;
  
  // Calculate the sum using BigInt to handle arbitrary large numbers
  const sum = BigInt(a_str) + BigInt(b_str);
  
  // Restore console.log
  console.log = originalLog;
  
  // Estimate memory usage (very rough approximation)
  operationMetrics.memoryBytes = 
    (a_str.length + b_str.length) * 2 + // String storage
    (carry.length * 4) + // Carry array
    (logs.join('').length * 2); // Logs
  
  const endTime = performance.now();
  
  return {
    carry,
    carryCount: carry.reduce((a, b) => a + b, 0),
    sum: sum.toString(),
    logs,
    metrics: {
      ...operationMetrics,
      executionTimeMs: endTime - startTime
    }
  };
}

/**
 * Browser-compatible interactive form for Gasing addition
 */
function setupGasingAdditionUI() {
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2>Gasing Addition with Carry Detection</h2>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label for="first-number">First Number:</label>
            <input type="text" id="first-number" style="width: 100%; padding: 8px; box-sizing: border-box;" value="129">
          </div>
          <div style="flex: 1;">
            <label for="second-number">Second Number:</label>
            <input type="text" id="second-number" style="width: 100%; padding: 8px; box-sizing: border-box;" value="987">
          </div>
        </div>
        <button id="calculate-btn" style="padding: 8px 15px; background: #4a90e2; color: white; border: none; cursor: pointer;">Calculate</button>
        
        <div style="margin-top: 20px;">
          <h3>Results:</h3>
          <div id="result-container" style="font-family: monospace; white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 4px; max-height: 400px; overflow-y: auto;"></div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>Metrics:</h3>
          <div id="metrics-container" style="font-family: monospace; background: #f0f8ff; padding: 15px; border-radius: 4px;"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    document.getElementById('calculate-btn').addEventListener('click', () => {
      const a_str = document.getElementById('first-number').value.trim();
      const b_str = document.getElementById('second-number').value.trim();
      
      if (!/^\d+$/.test(a_str) || !/^\d+$/.test(b_str)) {
        alert('Please enter valid numbers (digits only)');
        return;
      }
      
      const result = processAddition(a_str, b_str);
      
      document.getElementById('result-container').textContent = result.logs.join('\n') + 
        `\nCarry results per position (1=carry):\n${JSON.stringify(result.carry)}\n` +
        `Total carries detected: ${result.carryCount}\n` +
        `Sum: ${result.sum}`;
      
      document.getElementById('metrics-container').innerHTML = `
        <div>Digit Comparisons: ${result.metrics.digitComparisons}</div>
        <div>Lookahead Steps: ${result.metrics.lookaheadSteps}</div>
        <div>Memory Usage (estimate): ${result.metrics.memoryBytes} bytes</div>
        <div>Execution Time: ${result.metrics.executionTimeMs.toFixed(2)} ms</div>
      `;
    });
  }
}

// Node.js environment check
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    carryDetection,
    processAddition
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - set up UI when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGasingAdditionUI);
  } else {
    setupGasingAdditionUI();
  }
}

// Simple CLI interface if running directly in Node.js
if (typeof require !== 'undefined' && require.main === module) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log("Gasing Addition with carry detection and logging");
  
  readline.question('Enter first number: ', (a_str) => {
    readline.question('Enter second number: ', (b_str) => {
      const result = processAddition(a_str, b_str);
      
      // Print the logs
      result.logs.forEach(log => console.log(log));
      
      console.log("Carry results per position (1=carry):");
      console.log(result.carry);
      console.log(`Total carries detected: ${result.carryCount}`);
      console.log(`Sum: ${result.sum}`);
      
      console.log("\nPerformance Metrics:");
      console.log(`Digit Comparisons: ${result.metrics.digitComparisons}`);
      console.log(`Lookahead Steps: ${result.metrics.lookaheadSteps}`);
      console.log(`Memory Usage (estimate): ${result.metrics.memoryBytes} bytes`);
      console.log(`Execution Time: ${result.metrics.executionTimeMs.toFixed(2)} ms`);
      
      readline.close();
    });
  });
}
