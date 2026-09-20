import { MailTemplate, MailProvider } from '@common/constants/mail.constants';
import { MailAttachment } from '../types/mail-attachment.type';

export interface SendMailDto {
  to: string;

  template: MailTemplate;

  subject?: string;

  subjectKey?: string;

  language?: string;

  context?: Record<string, any>;

  provider?: MailProvider;

  cc?: string[];

  bcc?: string[];

  replyTo?: string;

  attachments?: MailAttachment[];
}
