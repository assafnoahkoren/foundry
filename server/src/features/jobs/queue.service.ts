import { Job, JobsOptions, BulkJobOptions } from 'bullmq';
import { queueFactory } from './queue.factory';
import { queueRegistry } from './queue.registry';
import { BaseJobData } from '.';

/**
 * Generic queue service that works with any registered queue
 */
export class QueueService {

  /**
   * Add a job to a queue
   */
  async addJob<T extends BaseJobData>(
    queueName: string,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    if (!queueRegistry.has(queueName)) {
      throw new Error(`Queue ${queueName} is not registered`);
    }

    const queue = queueFactory.createQueue<T>(queueName) as any;
    return await queue.add(`${queueName}-job`, data, options);
  }

  /**
   * Add multiple jobs to a queue
   */
  async addBulkJobs<T = any>(
    queueName: string,
    jobs: Array<{ name?: string; data: T; opts?: BulkJobOptions }>
  ): Promise<Job<T>[]> {
    if (!queueRegistry.has(queueName)) {
      throw new Error(`Queue ${queueName} is not registered`);
    }

    const queue = queueFactory.createQueue<T>(queueName);
    const bulkJobs = jobs.map((job, index) => ({
      name: job.name || `${queueName}-job-${index}`,
      data: job.data,
      opts: job.opts,
    }));
    return await queue.addBulk(bulkJobs as any) as any;
  }

  /**
   * Add a recurring job
   */
  async addRecurringJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    pattern: string,
    options?: {
      limit?: number;
      startDate?: Date | string;
      endDate?: Date | string;
      tz?: string;
    }
  ): Promise<Job<T>> {
    if (!queueRegistry.has(queueName)) {
      throw new Error(`Queue ${queueName} is not registered`);
    }

    const queue = queueFactory.createQueue<T>(queueName);
    
    const jobOptions: JobsOptions = {
      repeat: {
        pattern,
        ...options,
      },
    };
    
    return await queue.add(jobName as any, data as any, jobOptions) as any;
  }

  /**
   * Get a job by ID
   */
  async getJob<T = any>(
    queueName: string,
    jobId: string
  ): Promise<Job<T> | undefined> {
    const queue = queueFactory.getQueue<T>(queueName);
    if (!queue) return undefined;
    
    return await queue.getJob(jobId);
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return false;
    
    await job.remove();
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<boolean> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return false;
    
    await job.retry();
    return true;
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(queueName: string) {
    return await queueFactory.getQueueMetrics(queueName);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus<T = any>(
    queueName: string,
    status: 'completed' | 'waiting' | 'active' | 'delayed' | 'failed',
    start = 0,
    end = 19
  ): Promise<Job<T>[]> {
    const queue = queueFactory.getQueue<T>(queueName);
    if (!queue) return [];
    
    switch (status) {
      case 'completed':
        return await queue.getCompleted(start, end);
      case 'waiting':
        return await queue.getWaiting(start, end);
      case 'active':
        return await queue.getActive(start, end);
      case 'delayed':
        return await queue.getDelayed(start, end);
      case 'failed':
        return await queue.getFailed(start, end);
      default:
        return [];
    }
  }

}

export const queueService = new QueueService();