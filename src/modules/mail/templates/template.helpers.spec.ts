import * as Handlebars from 'handlebars';
import {
  getMailTranslation,
  registerTemplateHelpers,
} from './template.helpers';

jest.mock('handlebars', () => ({
  registerHelper: jest.fn(),
}));

describe('template.helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a "t" helper with Handlebars', () => {
    registerTemplateHelpers();
    expect(Handlebars.registerHelper).toHaveBeenCalledWith(
      't',
      expect.any(Function),
    );
  });

  it('translates a known key and replaces parameters', () => {
    const result = getMailTranslation('mail.welcome_message', { name: 'John' });
    expect(result).toBe('Hello John, welcome to our platform!');
  });

  it('returns key if unknown', () => {
    const result = getMailTranslation('unknown.key');
    expect(result).toBe('unknown.key');
  });
});
