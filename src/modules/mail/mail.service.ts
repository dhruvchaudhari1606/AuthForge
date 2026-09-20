import { Injectable, Logger } from '@nestjs/common';
import { SendMailDto } from './dto/send-mail.dto';
import { MailProvider } from '@common/constants/mail.constants';
import { TemplateService } from './templates/template.service';
import { MailProviderFactory } from './providers/provider.factory';
import { getMailTranslation } from './templates/template.helpers';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly templateService: TemplateService,
    private readonly providerFactory: MailProviderFactory,
  ) {}

  async send(data: SendMailDto): Promise<void> {
    try {
      const subject =
        data.subject ||
        (data.subjectKey
          ? getMailTranslation(data.subjectKey, data.context)
          : 'AuthForge Notification');

      const html = this.templateService.render(data.template, {
        ...data.context,
        language: data.language,
      });

      const provider = this.providerFactory.getProvider(
        data.provider || MailProvider.NODEMAILER,
      );

      await provider.send({
        to: data.to,
        subject,
        html,
        cc: data.cc,
        bcc: data.bcc,
        replyTo: data.replyTo,
        attachments: data.attachments,
      });

      this.logger.log(`Email sent successfully to ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}:`, error);
      throw error;
    }
  }
}
