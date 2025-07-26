/**
 * Feature registration with auto-discovery
 * Automatically finds and registers all *.job.ts and *.job.js files
 */

import { glob } from 'glob';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Dynamically discover and register all job files
 * Looks for any file ending with .job.ts or .job.js
 * and calls its default export (assumed to be a register function)
 */
export async function registerAllBackgroundJobsQueues(): Promise<void> {
  console.log('Auto-discovering job features...');
  
  try {
    // Find all job files (both .ts and .js)
    const jobFiles = await glob('**/*.job.{ts,js}', {
      cwd: path.join(__dirname, '../..'),
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', '**/job.template.ts', '**/job.template.js']
    });
    
    console.log(`Found ${jobFiles.length} job file(s)`);
    
    // Import and register each job
    for (const jobFile of jobFiles) {
      try {
        // Skip template files
        const basename = path.basename(jobFile);
        if (basename === 'template.job.ts' || basename === 'template.job.js') {
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
          console.log(`✅ Registered job from ${basename}`);
        } else {
          console.warn(`Job file ${basename} does not have a default export function`);
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
