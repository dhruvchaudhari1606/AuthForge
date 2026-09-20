import { MailTemplate } from '@common/constants/mail.constants';
import { SendMailDto } from './dto/send-mail.dto';
import { MailService } from './mail.service';
import { TemplateService } from './templates/template.service';
import { MailProviderFactory } from './providers/provider.factory';

describe('MailService', () => {
  const templateService = {
    render: jest.fn().mockReturnValue('<html><body>Welcome</body></html>'),
  } as unknown as TemplateService;

  const mockProvider = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const providerFactory = {
    getProvider: jest.fn().mockReturnValue(mockProvider),
  } as unknown as MailProviderFactory;

  let service: MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MailService(templateService, providerFactory);
  });

  it('sends an email with rendered template and provider', async () => {
    const data: SendMailDto = {
      to: 'user@example.com',
      subjectKey: 'mail.welcome_subject',
      template: MailTemplate.WELCOME,
      context: { name: 'John' },
      language: 'en',
    };

    await service.send(data);

    expect(templateService.render).toHaveBeenCalledWith(MailTemplate.WELCOME, {
      name: 'John',
      language: 'en',
    });
    expect(providerFactory.getProvider).toHaveBeenCalled();
    expect(mockProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        html: '<html><body>Welcome</body></html>',
      }),
    );
  });
});
