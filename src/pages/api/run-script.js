// Simple API endpoint to run the transcription script
// Using proper Astro API route syntax

export async function POST({ request }) {
  console.log('run-script API endpoint called');
  
  try {
    // Import modules dynamically to avoid SSR issues
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { fileURLToPath } = await import('url');
    const path = await import('path');
    
    const execPromise = promisify(exec);
    
    // Get the project root directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.default.dirname(__filename);
    const projectRoot = path.default.resolve(__dirname, '../../../');
    
    // Execute our shell script (similar to your content detection method)
    const command = `${projectRoot}/run-transcriber.sh`;
    console.log('Executing command:', command);
    
    try {
      const { stdout, stderr } = await execPromise(command);
      
      console.log('Script executed successfully', {
        stdoutLength: stdout.length,
        stderrLength: stderr.length
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          output: stdout,
          errorOutput: stderr,
          detectionMethod: 'shell_script'
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (execError) {
      console.error('Script execution error:', execError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: execError.message,
          errorOutput: execError.stderr,
          detectionMethod: 'execution_failed'
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
    console.error('API general error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        detectionMethod: 'error_in_processing'
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
