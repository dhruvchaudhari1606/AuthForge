export enum MailQueue {
  MAIL = 'mail_queue',
}

export enum MailJob {
  SEND_MAIL = 'send_mail',
}

export enum MailTemplate {
  WELCOME = 'welcome',
  RESET_PASSWORD = 'reset-password',
  PASSWORD_UPDATED = 'password-updated',
  VERIFY_EMAIL = 'verify-email',
}

export enum MailProvider {
  NODEMAILER = 'nodemailer',
  SENDGRID = 'sendgrid',
}

export const DEFAULT_MAIL_LANGUAGE = 'en';

export const MAIL_I18N_NAMESPACE = 'mail';
