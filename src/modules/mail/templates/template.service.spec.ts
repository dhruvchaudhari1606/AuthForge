import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { TemplateService } from './template.service';

jest.mock('fs');

jest.mock('handlebars', () => ({
  compile: jest.fn(),
  registerHelper: jest.fn(),
}));

jest.mock('mjml', () =>
  jest.fn(() => ({ html: '<html><body>rendered</body></html>' })),
);

jest.mock('./template.helpers', () => ({
  registerTemplateHelpers: jest.fn(),
}));

describe('TemplateService', () => {
  const compiledFn = jest.fn();

  let service: TemplateService;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue('<mjml>source</mjml>');
    compiledFn.mockReturnValue('<mjml>compiled</mjml>');
    (Handlebars.compile as jest.Mock).mockReturnValue(compiledFn);
    service = new TemplateService();
  });

  it('renders a template and returns HTML from mjml', () => {
    const html = service.render('welcome', { name: 'John', language: 'en' });

    expect(html).toBe('<html><body>rendered</body></html>');
    expect(compiledFn).toHaveBeenCalledWith({ name: 'John', language: 'en' });
  });

  it('reads the template file from the correct path', () => {
    service.render('welcome', {});

    const [calledPath] = (fs.readFileSync as jest.Mock).mock.calls[0] as [
      string,
      string,
    ];
    expect(calledPath).toMatch(/welcome\.mjml\.hbs$/);
    expect(calledPath).toMatch(/templates[/\\]email[/\\]welcome\.mjml\.hbs$/);
  });

  it('caches the compiled template on repeated calls', () => {
    service.render('welcome', { name: 'John' });
    service.render('welcome', { name: 'Jane' });

    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(Handlebars.compile).toHaveBeenCalledTimes(1);
    expect(compiledFn).toHaveBeenCalledTimes(2);
  });

  it('reads separate templates independently without cross-caching', () => {
    service.render('welcome', { name: 'John' });
    service.render('reset-password', { token: 'abc' });

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(Handlebars.compile).toHaveBeenCalledTimes(2);
  });
});
