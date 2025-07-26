import { Job } from 'bullmq';
import { queueRegistry } from '../../features/jobs/queue.registry';
import type { QueueDefinition } from '../../features/jobs/queue.registry';
import { queueService } from '../../features/jobs/queue.service';
import { QueuePriority } from '../../features/jobs';
import type { BaseJobData } from '../../features/jobs';
import { mailService } from './mail.service';
import type { EmailAddress } from './mail.types';
import type { TemplateName } from './template.service';
import { config } from '../../shared/config/config';

// Define the email job data structure
export interface EmailJobData extends BaseJobData {
  to: EmailAddress | EmailAddress[];
  template: TemplateName;
  variables: Record<string, unknown>;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email queue name
export const EMAIL_QUEUE = 'email';

// Email processor function
async function emailProcessor(job: Job<EmailJobData>): Promise<unknown> {
  const { to, template, variables } = job.data;
  
  console.log(`Processing email job ${job.id}: ${template} to ${Array.isArray(to) ? to.length : 1} recipient(s)`);
  
  try {
    // Send the email using the mail service
    const result = await mailService.sendTemplatedEmail({
      to,
      template: template,
      variables: {
        ...variables,
        _jobId: job.id,
        _attemptNumber: job.attemptsMade + 1,
      },
    });
    
    console.log(`Email job ${job.id} completed successfully`);
    return result;
  } catch (error) {
    console.error(`Email job ${job.id} failed:`, error);
    if (error instanceof Error) {
      error.message = `Failed to send ${template} email: ${error.message}`;
    }
    throw error;
  }
}

// Email queue definition
const emailQueueDefinition: QueueDefinition<EmailJobData> = {
  name: EMAIL_QUEUE,
  processor: emailProcessor,
  workerOptions: {
    concurrency: config.worker.emailConcurrency,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds base delay for emails
    },
  },
};

// Email queue service - handles generic email sending through the queue
export class EmailJobService {

  /**
   * Send an email through the queue
   */
  async sendEmail(options: {
    to: EmailAddress | EmailAddress[];
    template: TemplateName;
    variables: Record<string, unknown>;
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    priority?: number;
    userId?: string;
    delay?: number;
    attempts?: number;
  }): Promise<Job<EmailJobData>> {
    const { delay, attempts, priority, ...emailData } = options;

    return queueService.addJob(EMAIL_QUEUE, emailData, {
      priority: priority || QueuePriority.NORMAL,
      delay,
      attempts: attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

}

// Export the service instance
export const emailJobService = new EmailJobService();

// Register the email queue with the infrastructure
export function registerEmailJob(): void {
  queueRegistry.register(emailQueueDefinition);
}

// Default export for auto-discovery
export default registerEmailJob;