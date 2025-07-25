/**
 * Feature registration with auto-discovery
 * Automatically finds and registers all *.queue.ts files
 */

import { glob } from 'glob';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Dynamically discover and register all job files
 * Looks for any file ending with .job.ts in the src directory
 * and calls its default export (assumed to be a register function)
 */
export async function registerAllBackgroundJobsQueues(): Promise<void> {
  console.log('Auto-discovering job features...');
  
  try {
    // Find all *.job.ts files in the src directory
    const jobFiles = await glob('**/*.job.ts', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts', '**/job.template.ts']
    });
    
    console.log(`Found ${jobFiles.length} job file(s)`);
    
    // Import and register each job
    for (const jobFile of jobFiles) {
      try {
        // Skip template.job.ts files (ignore them)
        if (path.basename(jobFile) === 'template.job.ts') {
          continue;
        }
        // Convert to file:// URL for cross-platform compatibility
        const fileUrl = pathToFileURL(jobFile).href;
        
        // Import the module
        const jobModule = await import(fileUrl);
        
        // Check if it has a default export
        if (typeof jobModule.default === 'function') {
          // Call the registration function
          jobModule.default();
        } else {
          console.warn(`Job file ${jobFile} does not have a default export function`);
        }
      } catch (error) {
        console.error(`Failed to register job from ${jobFile}:`, error);
        // Continue with other jobs even if one fails
      }
    }
    
    console.log('All job features registered');
  } catch (error) {
    console.error('Failed to auto-discover jobs:', error);
    throw error;
  }
}
