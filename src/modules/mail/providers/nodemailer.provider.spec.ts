import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { NodemailerProvider } from './nodemailer.provider';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('NodemailerProvider', () => {
  const sendMailMock = jest.fn();

  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const map: Record<string, unknown> = {
        'nodemailer.host': 'smtp.example.com',
        'nodemailer.port': 587,
        'nodemailer.user': 'user@example.com',
        'nodemailer.pass': 'secret',
        'nodemailer.from': 'no-reply@example.com',
      };
      return key in map ? map[key] : defaultValue;
    }),
  } as unknown as ConfigService;

  let provider: NodemailerProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });
    provider = new NodemailerProvider(configService);
  });

  it('creates a transporter with config values on instantiation', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'secret',
      },
    });
  });

  it('sends mail with the from address from config', async () => {
    sendMailMock.mockResolvedValue(undefined);

    await provider.send({
      to: 'recipient@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'recipient@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
  });

  it('passes optional cc, bcc, replyTo and attachments through', async () => {
    sendMailMock.mockResolvedValue(undefined);

    await provider.send({
      to: 'a@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      replyTo: 'reply@example.com',
      attachments: [
        { filename: 'file.txt', content: 'data', contentType: 'text/plain' },
      ],
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        replyTo: 'reply@example.com',
        attachments: [
          { filename: 'file.txt', content: 'data', contentType: 'text/plain' },
        ],
      }),
    );
  });
});
