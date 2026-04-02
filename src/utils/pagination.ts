export function paginationParams(opts: { limit?: number; offset?: number }): Record<string, string> {
  const limit = Math.min(opts.limit ?? 25, 100);
  const offset = opts.offset ?? 0;
  return { limit: String(limit), offset: String(offset) };
}

export function formatPaginatedResponse(
  data: { count: number; results: unknown[] },
  limit: number,
  offset: number
): string {
  return JSON.stringify(
    {
      count: data.count,
      showing: data.results.length,
      offset,
      limit,
      has_more: offset + data.results.length < data.count,
      results: data.results,
    },
    null,
    2
  );
}
