import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryDto } from './query.dto';

describe('QueryDto', () => {
  it('uses default values', () => {
    const dto = plainToInstance(QueryDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.sortBy).toBe('createdAt');
    expect(dto.order).toBe('DESC');
  });

  it('transforms numeric values from query strings', () => {
    const dto = plainToInstance(QueryDto, {
      page: '3',
      limit: '15',
    });

    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(15);
  });

  it('fails validation for unsupported sort order', async () => {
    const dto = plainToInstance(QueryDto, {
      order: 'DOWN',
    });

    const errors = await validate(dto);

    expect(errors[0]?.constraints).toMatchObject({
      isIn: expect.any(String),
    });
  });
});
