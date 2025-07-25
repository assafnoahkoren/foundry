import { registerAllBackgroundJobsQueues } from './features/jobs/register-all-background-jobs-queues';
import { initializeQueueSystem, shutdownQueueSystem } from './features/jobs';

/**
 * Background job worker process
 * Run this separately from the web server
 */
const startWorker = async () => {
  try {
    console.log('🔧 Starting background job worker...');
    
    // Register all job features (auto-discovery)
    await registerAllBackgroundJobsQueues();
    
    // Initialize the queue system (creates workers)
    await initializeQueueSystem();
    
    console.log('📨 Worker process started successfully');
    console.log('⏳ Waiting for jobs...');
    
    // Keep the process alive
    process.stdin.resume();
  } catch (err) {
    console.error('Failed to start worker:', err);
    process.exit(1);
  }
};

// Graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down worker gracefully...`);
  
  try {
    await shutdownQueueSystem();
    console.log('✅ Worker shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during worker shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Start the worker
startWorker();