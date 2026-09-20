import { Logger } from '@nestjs/common';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let verboseSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    debugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);
    verboseSpy = jest
      .spyOn(Logger.prototype, 'verbose')
      .mockImplementation(() => undefined);

    service = new LoggerService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delegates log() to NestJS Logger with message and context', () => {
    service.log('test message', 'TestContext');

    expect(logSpy).toHaveBeenCalledWith('test message', 'TestContext');
  });

  it('delegates log() to NestJS Logger without context', () => {
    service.log('message only');

    expect(logSpy).toHaveBeenCalledWith('message only', undefined);
  });

  it('delegates error() to NestJS Logger with message, trace and context', () => {
    service.error('error message', 'stack-trace', 'ErrorContext');

    expect(errorSpy).toHaveBeenCalledWith(
      'error message',
      'stack-trace',
      'ErrorContext',
    );
  });

  it('delegates warn() to NestJS Logger with message and context', () => {
    service.warn('warn message', 'WarnContext');

    expect(warnSpy).toHaveBeenCalledWith('warn message', 'WarnContext');
  });

  it('delegates debug() to NestJS Logger with message and context', () => {
    service.debug('debug message', 'DebugContext');

    expect(debugSpy).toHaveBeenCalledWith('debug message', 'DebugContext');
  });

  it('delegates verbose() to NestJS Logger with message and context', () => {
    service.verbose('verbose message', 'VerboseContext');

    expect(verboseSpy).toHaveBeenCalledWith(
      'verbose message',
      'VerboseContext',
    );
  });
});
