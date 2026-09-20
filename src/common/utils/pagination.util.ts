export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export function buildPagination<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
}
