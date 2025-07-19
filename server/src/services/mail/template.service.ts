interface TemplateData {
  subject: string;
  html: string;
  text: string;
}

// Simple template system - you can expand this to use handlebars, etc.
const templates: Record<string, TemplateData> = {
  'welcome': {
    subject: 'Welcome to {{appName}}!',
    html: `
      <h1>Welcome to {{appName}}, {{name}}!</h1>
      <p>We're excited to have you on board.</p>
      <p>Get started by <a href="{{loginUrl}}">logging in</a>.</p>
    `,
    text: `
      Welcome to {{appName}}, {{name}}!
      
      We're excited to have you on board.
      
      Get started by logging in at: {{loginUrl}}
    `,
  },
  'reset-password': {
    subject: 'Reset your password',
    html: `
      <h1>Reset your password</h1>
      <p>Hi {{name}},</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="{{resetUrl}}">Reset Password</a></p>
      <p>This link will expire in {{expiryHours}} hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    text: `
      Reset your password
      
      Hi {{name}},
      
      Click the link below to reset your password:
      {{resetUrl}}
      
      This link will expire in {{expiryHours}} hours.
      
      If you didn't request this, please ignore this email.
    `,
  },
};

export async function renderTemplate(
  templateName: string, 
  variables: Record<string, unknown>
): Promise<TemplateData> {
  const template = templates[templateName];
  
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  // Simple variable replacement
  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(variables[key] || match);
    });
  };

  return {
    subject: replaceVariables(template.subject),
    html: replaceVariables(template.html),
    text: replaceVariables(template.text),
  };
}

export function getAvailableTemplates(): string[] {
  return Object.keys(templates);
}