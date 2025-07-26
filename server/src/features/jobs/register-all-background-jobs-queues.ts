/**
 * Feature registration with auto-discovery
 * Automatically finds and registers all *.job.ts and *.job.js files
 */

import { glob } from 'glob';
import path from 'path';

/**
 * Dynamically discover and register all job files
 * Looks for any file ending with .job.ts or .job.js based on current runtime
 * and calls its default export (assumed to be a register function)
 */
export async function registerAllBackgroundJobsQueues(): Promise<void> {
  console.log('Auto-discovering job features...');
  
  try {
    // Determine file extension based on current file's extension
    // If this file is .ts, we're in TypeScript environment; if .js, we're in compiled JavaScript
    const currentFileExtension = path.extname(__filename);
    const isTypeScript = currentFileExtension === '.ts';
    const filePattern = isTypeScript ? '**/*.job.ts' : '**/*.job.js';
    
    // The base directory depends on whether we're running TypeScript or JavaScript
    // In TypeScript: this file is at src/features/jobs/, so go up to src/
    // In JavaScript: this file is at dist/features/jobs/, so go up to dist/
    const baseDir = path.join(__dirname, '..', '..');
    
    // Find all job files
    const jobFiles = await glob(filePattern, {
      cwd: baseDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', '**/job.template.ts', '**/job.template.js']
    });
    
    console.log(`Found ${jobFiles.length} job file(s) matching pattern: ${filePattern}`);
    
    // Import and register each job
    for (const jobFile of jobFiles) {
      try {
        // Skip template files
        const basename = path.basename(jobFile);
        if (basename === 'template.job.ts' || basename === 'template.job.js') {
          continue;
        }
        
        console.log(`Loading job file: ${jobFile}`);
        
        // Convert to proper file URL for dynamic imports
        // On Windows, we need to handle the path properly
        const fileUrl = process.platform === 'win32' 
          ? `file:///${jobFile.replace(/\\/g, '/')}` 
          : jobFile;
        
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
