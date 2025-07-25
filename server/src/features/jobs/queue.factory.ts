import { Queue, Worker, Job, Processor, WorkerOptions } from 'bullmq';
import { getRedisOptions } from './redis.config';

/**
 * Generic queue factory that doesn't know about specific features
 */
export class QueueFactory {
  private queues: Map<string, Queue> = new Map();
  private workers: Worker[] = [];

  /**
   * Create or get an existing queue
   */
  createQueue<T = any>(name: string): Queue<T> {
    if (!this.queues.has(name)) {
      const connection = getRedisOptions();
      
      const queue = new Queue<T>(name, {
        connection,
        defaultJobOptions: {
          removeOnComplete: {
            age: 24 * 3600, // keep completed jobs for 24 hours
            count: 100, // keep last 100 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // keep failed jobs for 7 days
          },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // 2 seconds base delay
          },
        },
      });
      
      queue.on('error', (error) => {
        console.error(`Queue ${name} error:`, error);
      });
      
      this.queues.set(name, queue);
    }
    
    return this.queues.get(name) as Queue<T>;
  }

  /**
   * Create a worker to process jobs from a queue
   */
  createWorker<T = any>(
    name: string,
    processor: Processor<T>,
    options?: Partial<WorkerOptions>
  ): Worker<T> {
    const connection = getRedisOptions();
    const workerOptions: WorkerOptions = {
      connection,
      concurrency: 10, // Default concurrency
      ...options,
    };
    
    const worker = new Worker<T>(name, processor, workerOptions);
    
    // Generic event listeners
    worker.on('completed', (job: Job) => {
      console.log(`[${name}] Job ${job.id} completed`);
    });
    
    worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`[${name}] Job ${job?.id} failed:`, error);
    });
    
    worker.on('error', (error: Error) => {
      console.error(`[${name}] Worker error:`, error);
    });
    
    this.workers.push(worker);
    return worker;
  }

  /**
   * Get a queue by name
   */
  getQueue<T = any>(name: string): Queue<T> | undefined {
    return this.queues.get(name) as Queue<T> | undefined;
  }

  /**
   * Close all queues and workers
   */
  async closeAll(): Promise<void> {
    // Close all workers first
    await Promise.all(this.workers.map(worker => worker.close()));
    this.workers = [];
    
    // Close all queues
    await Promise.all([...this.queues.values()].map(queue => queue.close()));
    this.queues.clear();
  }

  /**
   * Get queue metrics for monitoring
   */
  async getQueueMetrics(name: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  } | null> {
    const queue = this.queues.get(name);
    if (!queue) return null;
    
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  /**
   * Get status of all queues and workers
   */
  getStatus(): {
    queues: string[];
    workers: number;
  } {
    return {
      queues: Array.from(this.queues.keys()),
      workers: this.workers.length,
    };
  }
}

export const queueFactory = new QueueFactory();