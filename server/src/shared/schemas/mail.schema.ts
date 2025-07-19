import { z } from 'zod';

// Email address validation
export const emailAddressSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

// Send email request schema
export const sendEmailSchema = z.object({
  to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
  from: emailAddressSchema.optional(), // Use default if not provided
  subject: z.string().min(1).max(200),
  html: z.string().optional(),
  text: z.string().optional(),
  replyTo: emailAddressSchema.optional(),
  cc: z.array(emailAddressSchema).optional(),
  bcc: z.array(emailAddressSchema).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    contentType: z.string().optional(),
  })).optional(),
});

// Email template schema
export const emailTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

// Send templated email schema
export const sendTemplatedEmailSchema = z.object({
  to: z.union([emailAddressSchema, z.array(emailAddressSchema)]),
  template: z.string(),
  variables: z.record(z.unknown()).optional(),
  from: emailAddressSchema.optional(),
  replyTo: emailAddressSchema.optional(),
});

// Email status schema
export const emailStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['queued', 'sent', 'failed', 'delivered', 'bounced']),
  error: z.string().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

// Types
export type EmailAddress = z.infer<typeof emailAddressSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type EmailTemplate = z.infer<typeof emailTemplateSchema>;
export type SendTemplatedEmailInput = z.infer<typeof sendTemplatedEmailSchema>;
export type EmailStatus = z.infer<typeof emailStatusSchema>;