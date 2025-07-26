import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../shared/config/config';
import type { SendEmailInput, SendTemplatedEmailInput, EmailStatus, EmailAddress } from '../../shared/schemas/mail.schema';
import { renderTemplate } from './template.service';
import { emailJobService } from './email.job';
import { QueuePriority } from '../../features/jobs';

class MailService {
  private transporter: Transporter;
  private fromAddress: EmailAddress;

  constructor() {
    // Configure from address
    this.fromAddress = config.mail.from;

    // Create SMTP transporter with environment-based configuration
    this.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: config.mail.auth,
      // For local development with Mailhog
      ignoreTLS: config.isDevelopment(),
    });

  }

  async sendEmail(input: SendEmailInput): Promise<EmailStatus> {
    try {
      const from = this.formatAddress(input.from || this.fromAddress);
      const to = Array.isArray(input.to) 
        ? input.to.map(addr => this.formatAddress(addr)).join(', ')
        : this.formatAddress(input.to);

      const mailOptions = {
        from,
        to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo ? this.formatAddress(input.replyTo) : undefined,
        cc: input.cc?.map(addr => this.formatAddress(addr)).join(', '),
        bcc: input.bcc?.map(addr => this.formatAddress(addr)).join(', '),
        attachments: input.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to: Array.isArray(input.to) ? input.to.map(t => t.email) : input.to.email,
        subject: input.subject,
      });

      return {
        id: info.messageId,
        status: 'sent',
        sentAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTemplatedEmail(input: SendTemplatedEmailInput): Promise<EmailStatus> {
    try {
      // Render the template
      const { subject, html, text } = await renderTemplate(input.template, input.variables || {});

      // Send as regular email
      return this.sendEmail({
        ...input,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send templated email:', error);
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }


  private formatAddress(address: EmailAddress): string {
    if (address.name) {
      return `"${address.name}" <${address.email}>`;
    }
    return address.email;
  }

  
  /**
   * Send a welcome email to a new user
   * Uses the job queue for reliable delivery
   */
  async sendWelcomeEmail(
    user: { id: string; email: string; name: string },
    options?: {
      appName?: string;
      loginUrl?: string;
    }
  ): Promise<EmailStatus> {
    try {
      const job = await emailJobService.sendEmail({
        to: { email: user.email, name: user.name },
        template: 'welcome',
        variables: {
          name: user.name,
          appName: options?.appName || config.app.name,
          loginUrl: options?.loginUrl || `${config.app.clientUrl}/login`,
        },
        priority: QueuePriority.HIGH,
        userId: user.id,
      });
      
      return {
        id: job.id as string,
        status: 'queued',
        queuedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to queue welcome email:', error);
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to queue email',
      };
    }
  }
  
  /**
   * Send a password reset email
   * Uses the job queue for reliable delivery
   */
  async sendPasswordResetEmail(
    user: { id: string; email: string; name: string },
    resetToken: string,
    resetUrl: string
  ): Promise<EmailStatus> {
    try {
      const job = await emailJobService.sendEmail({
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
      
      return {
        id: job.id as string,
        status: 'queued',
        queuedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to queue password reset email:', error);
      return {
        id: `error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to queue email',
      };
    }
  }
}

// Export singleton instance
export const mailService = new MailService();