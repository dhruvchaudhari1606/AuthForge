import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailProvider, SendMailOptions } from './mail-provider.interface';

@Injectable()
export class NodemailerProvider implements MailProvider {
  private transporter;

  constructor(private readonly configService: ConfigService) {
    const port = this.configService.get<number>('nodemailer.port', 587);
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('nodemailer.host'),
      port,
      secure: port === 465,
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
