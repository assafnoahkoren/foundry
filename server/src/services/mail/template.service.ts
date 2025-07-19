import { render } from '@react-email/render';
import { WelcomeEmail, ResetPasswordEmail } from './templates';

interface TemplateData {
  subject: string;
  html: string;
  text: string;
}

// Type-safe template mapping
const templateMap = {
  'welcome': {
    component: WelcomeEmail,
    getSubject: (props: { appName: string }) => `Welcome to ${props.appName}!`,
  },
  'reset-password': {
    component: ResetPasswordEmail,
    getSubject: () => 'Reset your password',
  },
} as const;

export type TemplateName = keyof typeof templateMap;

export async function renderTemplate(
  templateName: TemplateName, 
  variables: Record<string, unknown>
): Promise<TemplateData> {
  const template = templateMap[templateName];
  
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  try {
    // Render the React component to HTML
    const html = await render(template.component(variables as any), {
      pretty: true,
    });

    // Render plain text version
    const text = await render(template.component(variables as any), {
      plainText: true,
    });

    // Get the subject
    const subject = template.getSubject(variables as any);

    return {
      subject,
      html,
      text,
    };
  } catch (error) {
    console.error(`Failed to render template "${templateName}":`, error);
    throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getAvailableTemplates(): TemplateName[] {
  return Object.keys(templateMap) as TemplateName[];
}

// Type helpers for template variables
export interface WelcomeTemplateVariables {
  name: string;
  appName: string;
  loginUrl: string;
}

export interface ResetPasswordTemplateVariables {
  name: string;
  resetUrl: string;
  expiryHours: number;
}

export type TemplateVariables = {
  'welcome': WelcomeTemplateVariables;
  'reset-password': ResetPasswordTemplateVariables;
};