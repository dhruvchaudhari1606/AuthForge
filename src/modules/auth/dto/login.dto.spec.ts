import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('accepts valid email and password', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'admin@example.com',
      password: 'Admin@123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid email', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'invalid-email',
      password: 'Admin@123',
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      isEmail: expect.any(String),
    });
  });
});
