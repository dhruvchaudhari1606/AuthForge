import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { MailProvider, SendMailOptions } from './mail-provider.interface';

@Injectable()
export class SendgridProvider implements MailProvider {
  private readonly logger = new Logger(SendgridProvider.name);

  constructor(private readonly configService: ConfigService) {
    if (!this.configService.get<string>('sendgrid.apiKey')) {
      this.logger.error('SendGrid API key is not configured');
    } else {
      sgMail.setApiKey(this.configService.get<string>('sendgrid.apiKey')!);
    }
  }

  async send(options: SendMailOptions): Promise<void> {
    const attachments = options.attachments?.map((file) => ({
      filename: file.filename,
      type: file.contentType,
      disposition: 'attachment',
      content:
        typeof file.content === 'string'
          ? file.content
          : file.content?.toString('base64') || '',
    }));

    await sgMail.send({
      from: this.configService.get<string>('sendgrid.from', ''),
      to: options.to,
      subject: options.subject,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments,
    });
  }
}
