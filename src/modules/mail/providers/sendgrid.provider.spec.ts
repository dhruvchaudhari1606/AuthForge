import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { SendgridProvider } from './sendgrid.provider';

jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

describe('SendgridProvider', () => {
  const makeConfigService = (apiKey: string | undefined) =>
    ({
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const map: Record<string, unknown> = {
          'sendgrid.apiKey': apiKey,
          'sendgrid.from': 'no-reply@sendgrid.example.com',
        };
        return key in map ? map[key] : defaultValue;
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the SendGrid API key on instantiation', () => {
    new SendgridProvider(makeConfigService('SG.test-key'));
    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test-key');
  });

  it('does not call setApiKey when API key is missing', () => {
    new SendgridProvider(makeConfigService(undefined));
    expect(sgMail.setApiKey).not.toHaveBeenCalled();
  });

  it('sends mail with correct options', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);
    const provider = new SendgridProvider(makeConfigService('SG.test-key'));

    await provider.send({
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'no-reply@sendgrid.example.com',
        to: 'user@example.com',
        subject: 'Hello',
        html: '<p>Hi</p>',
      }),
    );
  });

  it('passes optional cc, bcc, and replyTo fields', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);
    const provider = new SendgridProvider(makeConfigService('SG.test-key'));

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      replyTo: 'reply@example.com',
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        replyTo: 'reply@example.com',
      }),
    );
  });

  it('maps string attachments to SendGrid format', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);
    const provider = new SendgridProvider(makeConfigService('SG.test-key'));

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      attachments: [
        {
          filename: 'file.txt',
          content: 'base64data',
          contentType: 'text/plain',
        },
      ],
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            filename: 'file.txt',
            type: 'text/plain',
            disposition: 'attachment',
            content: 'base64data',
          },
        ],
      }),
    );
  });

  it('maps Buffer attachments to base64 string', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);
    const provider = new SendgridProvider(makeConfigService('SG.test-key'));
    const buf = Buffer.from('binary-content');

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      attachments: [
        { filename: 'img.png', content: buf, contentType: 'image/png' },
      ],
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          {
            filename: 'img.png',
            type: 'image/png',
            disposition: 'attachment',
            content: buf.toString('base64'),
          },
        ],
      }),
    );
  });

  it('sends undefined attachments when none are provided', async () => {
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);
    const provider = new SendgridProvider(makeConfigService('SG.test-key'));

    await provider.send({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: undefined }),
    );
  });
});
