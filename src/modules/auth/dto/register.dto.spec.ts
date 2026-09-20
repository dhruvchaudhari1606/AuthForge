import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('accepts valid payload', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      language: 'en',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects short passwords', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'John Doe',
      email: 'john@example.com',
      password: '123',
      language: 'en',
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      minLength: expect.any(String),
    });
  });

  it('rejects passwords failing complexity regex', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'simplepassword',
      language: 'en',
    });

    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === 'password');

    expect(passwordError?.constraints).toMatchObject({
      matches: expect.any(String),
    });
  });

  it('rejects invalid language', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      language: 'de',
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      isIn: expect.any(String),
    });
  });

  it('rejects missing language', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'language')).toBe(true);
  });
});
