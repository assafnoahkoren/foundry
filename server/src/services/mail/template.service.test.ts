import { describe, it, expect } from 'vitest';
import { renderTemplate } from './template.service';

describe('Email Template Service', () => {
  describe('renderTemplate', () => {
    it('should render welcome email template', async () => {
      const result = await renderTemplate('welcome', {
        name: 'John Doe',
        appName: 'Foundry Test',
        loginUrl: 'https://example.com/login',
      });

      expect(result).toBeDefined();
      expect(result.subject).toBe('Welcome to Foundry Test!');
      expect(result.html).toContain('Welcome to');
      expect(result.html).toContain('Foundry Test');
      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('href="https://example.com/login"');
      expect(result.text).toContain('WELCOME TO FOUNDRY TEST, JOHN DOE!');
      expect(result.text).toContain('https://example.com/login');
    });

    it('should render reset-password email template', async () => {
      const result = await renderTemplate('reset-password', {
        name: 'Jane Smith',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiryHours: 24,
      });

      expect(result).toBeDefined();
      expect(result.subject).toBe('Reset your password');
      expect(result.html).toContain('Hi');
      expect(result.html).toContain('Jane Smith');
      expect(result.html).toContain('href="https://example.com/reset?token=abc123"');
      expect(result.html).toContain('This link will expire in');
      expect(result.html).toContain('24');
      expect(result.html).toContain('hours');
      expect(result.text).toContain('RESET YOUR PASSWORD');
      expect(result.text).toContain('Jane Smith');
      expect(result.text).toContain('https://example.com/reset?token=abc123');
    });

    it('should throw error for unknown template', async () => {
      await expect(
        renderTemplate('unknown' as any, {})
      ).rejects.toThrow('Template "unknown" not found');
    });

    it('should handle missing variables gracefully', async () => {
      const result = await renderTemplate('welcome', {
        name: 'Test User',
        appName: 'Test App',
        // loginUrl is missing
      } as any);

      expect(result).toBeDefined();
      expect(result.html).toContain('Test User');
      expect(result.html).toContain('Test App');
    });
  });
});