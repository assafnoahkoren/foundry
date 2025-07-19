# Mail Service (Internal Use Only)

A simple SMTP-based mail service for internal backend use. This service uses SMTP configuration for all environments and is not exposed through the public API.

## Features

- **Unified SMTP Configuration**: Uses SMTP for all environments (development and production)
- **Development**: Uses Mailhog (local SMTP container) for email capture
- **Production**: Works with any SMTP provider (Gmail, SendGrid SMTP, AWS SES SMTP, etc.)
- **React Email Templates**: Beautiful, responsive email templates built with React components
- **Type-safe**: Full TypeScript support with Zod schemas
- **Automatic Plain Text**: Generates both HTML and plain text versions from React templates

## Setup

### Development

1. Start the Mailhog container:
```bash
docker-compose up mailhog
```

2. Access Mailhog UI at http://localhost:13005

3. All emails sent in development will be captured by Mailhog

### Production

Configure your `.env` file with SMTP settings:

#### Gmail SMTP
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-specific-password
```

#### SendGrid SMTP
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=apikey
MAIL_PASS=your-sendgrid-api-key
```

#### AWS SES SMTP
```env
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-smtp-username
MAIL_PASS=your-smtp-password
```

## Usage (Internal Backend Only)

### Send a simple email

```typescript
import { mailService } from '../services/mail/mail.service';

const result = await mailService.sendEmail({
  to: { email: 'user@example.com', name: 'John Doe' },
  subject: 'Hello from Foundry',
  text: 'This is a plain text email',
  html: '<p>This is an <strong>HTML</strong> email</p>',
});
```

### Send a templated email

```typescript
import { mailService } from '../services/mail/mail.service';

const result = await mailService.sendTemplatedEmail({
  to: { email: 'user@example.com', name: 'John Doe' },
  template: 'welcome',
  variables: {
    name: 'John',
    appName: 'Foundry',
    loginUrl: 'https://app.example.com/login',
  },
});
```

### Check email status

```typescript
const status = await mailService.getEmailStatus(result.id);
```

### Health check

```typescript
const isHealthy = await mailService.healthCheck();
console.log('Mail service healthy:', isHealthy);
```

### Example: Integration in Auth Service

```typescript
// In auth.service.ts
import { mailService } from './mail/mail.service';

// After successful registration
mailService.sendTemplatedEmail({
  to: { email: user.email, name: user.name },
  template: 'welcome',
  variables: {
    name: user.name,
    appName: config.app.name,
    loginUrl: `${config.app.clientUrl}/login`,
  },
}).catch(error => {
  console.error('Failed to send welcome email:', error);
  // Don't fail registration if email fails
});
```

## Previewing Email Templates in Development

React Email provides a beautiful preview interface for developing and testing email templates:

1. Start the email preview server:
```bash
cd server
npm run email:preview
```

2. Open http://localhost:13006 in your browser

3. You'll see all your email templates with:
   - **Live hot reloading** - Edit templates and see changes instantly
   - Responsive device preview (desktop, tablet, mobile)
   - HTML source code view
   - Plain text version
   - Send test emails directly from the UI

4. Edit templates in `server/src/services/mail/templates/` and changes will automatically sync and reload in the preview

### Preview Features

- **Hot Reload**: Changes to templates are reflected immediately
- **Test Data**: Each template includes `PreviewProps` with sample data
- **Multiple Viewports**: Test how emails look on different devices
- **Dark Mode**: Preview how emails look in dark mode clients
- **Send Test**: Send actual test emails to verify rendering

## Available Templates

- `welcome` - Welcome email for new users
- `reset-password` - Password reset email

## Project Structure

```
server/src/services/mail/
├── mail.service.ts          # Main mail service with SMTP configuration
├── template.service.ts      # Template rendering logic
├── email.config.js          # Email configuration
├── watch-email-templates.js # Development preview script
├── templates/               # React Email templates
│   ├── welcome.tsx
│   ├── reset-password.tsx
│   └── index.ts
├── emails/                  # Auto-generated (git ignored)
└── README.md               # This file
```

## Adding New Templates

1. Create a new React component in `server/src/services/mail/templates/`:

```tsx
// server/src/services/mail/templates/notification.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

export interface NotificationEmailProps {
  title: string;
  message: string;
}

export const NotificationEmail = ({
  title,
  message,
}: NotificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body>
        <Container>
          <Heading>{title}</Heading>
          <Text>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NotificationEmail;
```

2. Add it to the template map in `template.service.ts`:

```typescript
import { NotificationEmail } from './templates/notification';

const templateMap = {
  // ... existing templates
  'notification': {
    component: NotificationEmail,
    getSubject: (props: { title: string }) => props.title,
  },
} as const;
```

3. Update the template enum in `mail.schema.ts`:

```typescript
template: z.enum(['welcome', 'reset-password', 'notification']),
```

## Testing

The mail service includes comprehensive tests. Run them with:

```bash
npm test -- mail.service.test.ts
```

## Security Notes

1. Never commit API keys or SMTP passwords
2. Use app-specific passwords for Gmail/Outlook
3. Implement rate limiting for production use
4. This service is for internal backend use only - do not expose via public API
5. Always validate email addresses before sending
6. Consider implementing a queue for high-volume email sending

## Troubleshooting

### Mailhog not receiving emails
- Check if container is running: `docker ps`
- Verify MAIL_HOST=localhost and MAIL_PORT=13004 in .env
- Check server logs for connection errors

### Production SMTP errors
- Verify credentials are correct
- For SendGrid SMTP: Use "apikey" as username and your API key as password
- Check provider dashboard for quota limits
- Ensure sender email is verified/authorized

### SMTP connection errors
- For Gmail: Enable 2FA and use app-specific password
- Check firewall settings for SMTP ports
- Verify MAIL_SECURE setting matches provider requirements (true for port 465, false for 587)