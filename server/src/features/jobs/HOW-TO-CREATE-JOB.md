# How to Create a New Background Job

This guide explains how to create a new background job in the simplest way possible.

## Quick Steps

1. Create a new file: `src/features/background-jobs/queues/[feature]/[feature].job.ts`
2. Copy the template below
3. Replace `[FEATURE]` with your feature name
4. Implement your processor logic
5. That's it! The job will be auto-discovered on server startup

## Minimal Job Template


```typescript
export const MY_QUEUE = 'my-feature';import { Job } from 'bullmq';
import { queueRegistry } from '../../queue.registry';
import { queueService } from '../../queue.service';
import { BaseJobData } from '../../infra';

// 1. Define your job data structure (REQUIRED)
export interface MyJobData extends BaseJobData {
  // Add your job-specific fields here
  message: string;
  targetId: string;
}

// 2. Define queue name constant (REQUIRED)
export const MY_QUEUE = 'my-feature';

// 3. Create processor function (REQUIRED)
async function myProcessor(job: Job<MyJobData>): Promise<void> {
  const { message, targetId } = job.data;
  
  // Your processing logic here
  console.log(`Processing job ${job.id}: ${message} for ${targetId}`);
  
  // Throw error to retry, return to complete
}

// 4. Create a type-safe function to add jobs (REQUIRED)
export async function addMyJob(data: MyJobData) {
  return queueService.addJob(MY_QUEUE, data);
}

// 5. Register function (REQUIRED - must be default export and the file must end with *.job.ts)
export default function register() {
  queueRegistry.register({
    name: MY_QUEUE,
    processor: myProcessor,
  });
}
```
