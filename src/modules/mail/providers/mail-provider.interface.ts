import { MailAttachment } from '../types/mail-attachment.type';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;

  cc?: string[];
  bcc?: string[];
  replyTo?: string;

  attachments?: MailAttachment[];
}

export interface MailProvider {
  send(options: SendMailOptions): Promise<void>;
}
