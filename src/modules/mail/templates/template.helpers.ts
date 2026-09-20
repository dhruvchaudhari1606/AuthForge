import * as Handlebars from 'handlebars';

const mailTranslations: Record<string, string> = {
  'mail.welcome_subject': 'Welcome to AuthForge',
  'mail.welcome_title': 'Welcome to AuthForge!',
  'mail.welcome_message': 'Hello {name}, welcome to our platform!',
  'mail.reset_subject': 'Reset your password',
  'mail.reset_subtitle': 'Security alert',
  'mail.reset_title': 'Password reset request',
  'mail.reset_message':
    'Hi {name}, we received a request to reset your password. This link will expire in {expiresInMinutes} minutes.',
  'mail.reset_button': 'Reset password',
  'mail.reset_link_fallback':
    'If the button does not work, copy and paste this link into your browser:',
  'mail.reset_device_title': 'Request details',
  'mail.reset_device_name_label': 'Device',
  'mail.reset_browser_label': 'Browser',
  'mail.reset_os_label': 'Operating system',
  'mail.reset_device_type_label': 'Device type',
  'mail.reset_ip_label': 'IP address',
  'mail.reset_time_label': 'Request time (UTC)',
  'mail.reset_footer':
    'If you did not request this, you can safely ignore this email.',
  'mail.password_updated_subject': 'Your password was changed',
  'mail.password_updated_subtitle': 'Account security update',
  'mail.password_updated_title': 'Your password has been updated',
  'mail.password_updated_message':
    'Hi {name}, this is a confirmation that your password was changed successfully.',
  'mail.password_updated_device_title': 'Change details',
  'mail.password_updated_device_name_label': 'Device',
  'mail.password_updated_browser_label': 'Browser',
  'mail.password_updated_os_label': 'Operating system',
  'mail.password_updated_device_type_label': 'Device type',
  'mail.password_updated_ip_label': 'IP address',
  'mail.password_updated_time_label': 'Changed at (UTC)',
  'mail.password_updated_footer':
    'If this was not you, secure your account immediately and contact support.',
  'mail.verify_email_subject': 'Verify your email address',
  'mail.verify_email_subtitle': 'Account verification',
  'mail.verify_email_title': 'Verify your email address',
  'mail.verify_email_message':
    'Hi {name}, thank you for registering with AuthForge. Please verify your email address to activate all account features. This link will expire in {expiresInHours} hours.',
  'mail.verify_email_button': 'Verify email',
  'mail.verify_email_link_fallback':
    'If the button does not work, copy and paste this link into your browser:',
  'mail.verify_email_footer':
    'If you did not create an account, you can safely ignore this email.',
};

export const getMailTranslation = (
  key: string,
  args?: Record<string, unknown>,
): string => {
  let text = mailTranslations[key] || key;
  if (args) {
    for (const [k, v] of Object.entries(args)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
};

export const registerTemplateHelpers = (): void => {
  Handlebars.registerHelper(
    't',
    function (key: string, options: Handlebars.HelperOptions): string {
      const args = (options?.hash as Record<string, unknown> | undefined) ?? {};
      return getMailTranslation(key, args);
    },
  );
};
