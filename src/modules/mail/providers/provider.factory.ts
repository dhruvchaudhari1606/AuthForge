import { Injectable } from '@nestjs/common';
import { MailProvider } from './mail-provider.interface';
import { NodemailerProvider } from './nodemailer.provider';
import { SendgridProvider } from './sendgrid.provider';
import { MailProvider as MailProviderType } from '@common/constants/mail.constants';

@Injectable()
export class MailProviderFactory {
  constructor(
    private readonly nodemailer: NodemailerProvider,
    private readonly sendgrid: SendgridProvider,
  ) {}

  getProvider(provider?: MailProviderType): MailProvider {
    switch (provider) {
      case MailProviderType.SENDGRID:
        return this.sendgrid;

      case MailProviderType.NODEMAILER:
      default:
        return this.nodemailer;
    }
  }
}
