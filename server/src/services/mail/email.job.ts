import { Job } from 'bullmq';
import { queueRegistry, QueueDefinition } from '../../features/jobs/queue.registry';
import { queueService } from '../../features/jobs/queue.service';
import { BaseJobData, QueuePriority } from '../../features/jobs';
import { mailService } from './mail.service';
import { EmailAddress } from './mail.types';

// Define the email job data structure
export interface EmailJobData extends BaseJobData {
  to: EmailAddress | EmailAddress[];
  template: string;
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
      template: template as 'welcome' | 'reset-password',
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
    concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '5', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds base delay for emails
    },
  },
};

// Email queue service with domain-specific methods
export class EmailJobService {

  /**
   * Send an email through the queue
   */
  async sendEmail(options: {
    to: EmailAddress | EmailAddress[];
    template: string;
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

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(
    user: { id: string; email: string; name: string },
    options?: {
      appName: string;
      loginUrl: string;
      priority?: number;
    }
  ): Promise<Job<EmailJobData>> {
    return this.sendEmail({
      to: { email: user.email, name: user.name },
      template: 'welcome',
      variables: {
        name: user.name,
        appName: options?.appName || 'Foundry',
        loginUrl: options?.loginUrl || process.env.CLIENT_URL + '/login',
      },
      priority: options?.priority || QueuePriority.HIGH,
      userId: user.id,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(
    user: { id: string; email: string; name: string },
    resetToken: string,
    resetUrl: string
  ): Promise<Job<EmailJobData>> {
    return this.sendEmail({
      to: { email: user.email, name: user.name },
      template: 'reset-password',
      variables: {
        name: user.name,
        resetUrl,
        resetToken,
        expiresIn: '1 hour',
      },
      priority: QueuePriority.CRITICAL,
      userId: user.id,
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