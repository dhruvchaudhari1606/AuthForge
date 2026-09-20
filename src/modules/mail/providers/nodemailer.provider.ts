import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailProvider, SendMailOptions } from './mail-provider.interface';

@Injectable()
export class NodemailerProvider implements MailProvider {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('nodemailer.host'),
      port: this.configService.get<number>('nodemailer.port', 587),
      secure: false,

      auth: {
        user: this.configService.get<string>('nodemailer.user'),
        pass: this.configService.get<string>('nodemailer.pass'),
      },
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get<string>('nodemailer.from'),
      ...options,
    });
  }
}
