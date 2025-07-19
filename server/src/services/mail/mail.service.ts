import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../shared/config/config';
import type { SendEmailInput, SendTemplatedEmailInput, EmailStatus, EmailAddress } from '../../shared/schemas/mail.schema';
import { renderTemplate } from './template.service';

class MailService {
  private transporter: Transporter;
  private fromAddress: EmailAddress;

  constructor() {
    // Configure from address
    this.fromAddress = {
      email: process.env.MAIL_FROM_EMAIL || 'noreply@foundry.local',
      name: process.env.MAIL_FROM_NAME || 'Foundry App',
    };

    // Create SMTP transporter with environment-based configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT || '13004', 10),
      secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
      auth: process.env.MAIL_USER && process.env.MAIL_PASS ? {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      } : undefined,
      // For local development with Mailhog
      ignoreTLS: config.isDevelopment(),
    });

    // Log configuration (without sensitive data)
    console.log('Mail service initialized:', {
      host: process.env.MAIL_HOST || 'localhost',
      port: process.env.MAIL_PORT || '13004',
      secure: process.env.MAIL_SECURE === 'true',
      auth: !!(process.env.MAIL_USER && process.env.MAIL_PASS),
      from: this.fromAddress.email,
      environment: config.server.nodeEnv,
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

  async getEmailStatus(emailId: string): Promise<EmailStatus | null> {
    // SMTP doesn't provide real-time status tracking
    // This would require implementing webhooks or email tracking services
    // For now, we return a basic status
    return {
      id: emailId,
      status: 'sent',
      sentAt: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Mail service health check failed:', error);
      return false;
    }
  }

  private formatAddress(address: EmailAddress): string {
    if (address.name) {
      return `"${address.name}" <${address.email}>`;
    }
    return address.email;
  }

  getConfig(): { host: string; port: number; from: EmailAddress } {
    return {
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_PORT || '13004', 10),
      from: this.fromAddress,
    };
  }
}

// Export singleton instance
export const mailService = new MailService();