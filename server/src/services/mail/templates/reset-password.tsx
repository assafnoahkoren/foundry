import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
  expiryHours: number;
}

export const ResetPasswordEmail = ({
  name,
  resetUrl,
  expiryHours,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset your password. Click the button below to create a new password:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in {expiryHours} hours.
          </Text>
          <Text style={footer}>
            If you didn't request this password reset, you can safely ignore this email. 
            Your password won't be changed until you create a new one.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

ResetPasswordEmail.PreviewProps = {
  name: 'John Doe',
  resetUrl: 'https://app.example.com/reset-password?token=abc123',
  expiryHours: 24,
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  marginTop: '32px',
};