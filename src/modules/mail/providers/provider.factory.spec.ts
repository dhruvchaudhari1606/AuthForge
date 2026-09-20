import { MailProvider as MailProviderType } from '@common/constants/mail.constants';
import { NodemailerProvider } from './nodemailer.provider';
import { SendgridProvider } from './sendgrid.provider';
import { MailProviderFactory } from './provider.factory';

describe('MailProviderFactory', () => {
  const nodemailer = {} as NodemailerProvider;
  const sendgrid = {} as SendgridProvider;

  let factory: MailProviderFactory;

  beforeEach(() => {
    factory = new MailProviderFactory(nodemailer, sendgrid);
  });

  it('returns the nodemailer provider for NODEMAILER type', () => {
    expect(factory.getProvider(MailProviderType.NODEMAILER)).toBe(nodemailer);
  });

  it('returns the sendgrid provider for SENDGRID type', () => {
    expect(factory.getProvider(MailProviderType.SENDGRID)).toBe(sendgrid);
  });

  it('falls back to nodemailer when provider is undefined', () => {
    expect(factory.getProvider(undefined)).toBe(nodemailer);
  });
});
