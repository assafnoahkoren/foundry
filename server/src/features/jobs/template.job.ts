import { Job } from 'bullmq';
import { queueRegistry } from './queue.registry';
import { queueService } from './queue.service';
import { BaseJobData } from '.';

// ============================================
// TEMPLATE: Replace 'Example' with your feature name
// File should be: [feature]/[feature].job.ts
// ============================================

// 1. Define your job data structure
export interface ExampleJobData extends BaseJobData {
  // Add your job-specific fields here
  message: string;
  // targetId: string;
  // action: 'create' | 'update' | 'delete';
}

// 2. Define queue name constant (only export if needed elsewhere)
const EXAMPLE_QUEUE = 'example';

// 3. Create processor function
async function exampleProcessor(job: Job<ExampleJobData>): Promise<void> {
  const { message } = job.data;
  
  console.log(`Processing ${EXAMPLE_QUEUE} job ${job.id}: ${message}`);
  
  // TODO: Implement your processing logic here
  // - Throw error to retry the job
  // - Return normally to mark as complete
  
  // Example:
  // try {
  //   await someAsyncOperation(job.data);
  // } catch (error) {
  //   console.error(`Job ${job.id} failed:`, error);
  //   throw error; // This will trigger retry
  // }
}

// 4. Create type-safe function to add jobs
export async function addExampleJob(data: Omit<ExampleJobData, keyof BaseJobData> & Partial<BaseJobData>) {
  return queueService.addJob(EXAMPLE_QUEUE, data);
}

// 5. Register function (must be default export for auto-discovery)
export default function register() {
  queueRegistry.register({
    name: EXAMPLE_QUEUE,
    processor: exampleProcessor,
    // Optional: Override default worker options
    // workerOptions: {
    //   concurrency: 5, // Default: 10
    // },
    // Optional: Override default job options
    // defaultJobOptions: {
    //   attempts: 5,    // Default: 3
    //   backoff: {
    //     type: 'exponential',
    //     delay: 10000, // Default: 2000ms
    //   },
    // },
  });
}