// React Email configuration
module.exports = {
  // Port for the preview server
  previewPort: 13006,
  
  // Directory configurations
  templatesDir: './templates',
  emailsDir: './emails',
  
  // Email settings
  defaultFrom: {
    email: process.env.MAIL_FROM_EMAIL || 'noreply@foundry.local',
    name: process.env.MAIL_FROM_NAME || 'Foundry App',
  },
};