// API endpoint to run Python transcription script
// Using proper Astro API route syntax - default export with POST, GET, etc. methods

export async function POST({ request }) {
  console.log('Transcription API endpoint called with POST method');
  
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { fileURLToPath } = await import('url');
    const path = await import('path');
    
    const execPromise = promisify(exec);
    
    // Track detection and execution methods (like your file detection system)
    let executionMethod = 'direct_execution';
    const startTime = Date.now();
    
    // Get file paths
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.default.dirname(__filename);
    const projectRoot = path.default.resolve(__dirname, '../../../');
    const scriptDir = path.default.join(projectRoot, 'Docs', 'to-do-plan');
    
    console.log('Transcription API - Path detection:', {
      projectRoot,
      scriptDir,
      detectionTime: Date.now() - startTime
    });
    
    // Construct command with proper environment setup
    const command = `cd "${scriptDir}" && source venv/bin/activate && python generator/audio_transcriber.py`;
    
    console.log('Transcription API - Executing command:', command);
    
    try {
      // Execute the command
      const { stdout, stderr } = await execPromise(command);
      const executionTime = Date.now() - startTime;
      
      console.log('Transcription API - Execution completed:', {
        executionTimeMs: executionTime,
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        executionMethod
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          output: stdout,
          errorOutput: stderr,
          executionTime,
          executionMethod
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (execError) {
      console.error('Transcription API - Execution error:', {
        error: execError.message,
        command,
        errorOutput: execError.stderr
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          error: execError.message,
          errorOutput: execError.stderr,
          executionMethod: 'execution_failed'
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  } catch (error) {
    console.error('Transcription API - General error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        executionMethod: 'error_in_processing'
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
