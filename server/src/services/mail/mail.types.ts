export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailTemplateData {
  [key: string]: any;
}

export type TemplateName = 'welcome' | 'reset-password';

export interface SendEmailOptions {
  to: EmailAddress | EmailAddress[];
  template: TemplateName;
  variables: EmailTemplateData;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
}