import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.warn('[Resend] RESEND_API_KEY is not defined in environment variables:', {
    emailFunctionality: 'disabled',
    impact: 'No emails will be sent',
    action: 'Add RESEND_API_KEY to .env file to enable email sending',
  });
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Checks if email sending is enabled.
 * 
 * BOTH conditions must be met:
 * 1. RESEND_API_KEY must be set (for the email service to work)
 * 2. EMAIL_ENABLED must be explicitly set to 'true' (opt-in safety feature)
 * 
 * This dual requirement prevents accidental email sending in development/testing
 * environments even if API keys are present.
 * 
 * @returns true only if both conditions are met
 */
export const isEmailEnabled = (): boolean => {
  return !!resendApiKey && process.env.EMAIL_ENABLED === 'true';
};

export const getFromEmail = (): string => {
  return process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
};

export const getFromName = (): string => {
  return process.env.RESEND_FROM_NAME ?? 'MERN E-commerce';
};