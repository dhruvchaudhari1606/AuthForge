import { buildPagination } from './pagination.util';

describe('buildPagination', () => {
  it('builds expected metadata', () => {
    const items = [{ id: '1' }, { id: '2' }];

    expect(buildPagination(items, 25, 2, 10)).toEqual({
      items,
      meta: {
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
      },
    });
  });

  it('returns zero total pages when there are no items', () => {
    expect(buildPagination([], 0, 1, 10).meta.totalPages).toBe(0);
  });
});
