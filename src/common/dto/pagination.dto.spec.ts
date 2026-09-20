import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('uses default values', () => {
    const dto = plainToInstance(PaginationDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('fails validation for non-positive values', async () => {
    const dto = plainToInstance(PaginationDto, {
      page: 0,
      limit: -1,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(2);
  });
});
