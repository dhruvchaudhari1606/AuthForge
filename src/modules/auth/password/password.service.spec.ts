import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;
  const configService = {
    get: jest.fn().mockReturnValue(10),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    passwordService = new PasswordService(configService);
  });

  describe('hash and compare', () => {
    it('hashes a plain password and compares correctly', async () => {
      const plain = 'StrongPass123!';
      const hashed = await passwordService.hash(plain);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plain);

      const isMatch = await passwordService.compare(plain, hashed);
      expect(isMatch).toBe(true);

      const isWrong = await passwordService.compare('WrongPass123!', hashed);
      expect(isWrong).toBe(false);
    });

    it('returns false when comparing empty plain or hash', async () => {
      expect(await passwordService.compare('', 'hash')).toBe(false);
      expect(await passwordService.compare('plain', '')).toBe(false);
    });
  });

  describe('validateStrength', () => {
    it('accepts strong password', () => {
      const result = passwordService.validateStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = passwordService.validateStrength('Sh1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('rejects passwords missing special characters or numbers', () => {
      const noSpecial = passwordService.validateStrength('StrongPassword123');
      expect(noSpecial.isValid).toBe(false);

      const noNumber = passwordService.validateStrength('StrongPassword!');
      expect(noNumber.isValid).toBe(false);

      const noUpper = passwordService.validateStrength('strongpassword123!');
      expect(noUpper.isValid).toBe(false);
    });
  });
});
