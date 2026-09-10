using Microsoft.EntityFrameworkCore;

namespace RetroRewindWebsite.Models.DTOs.Common;

public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int CurrentPage,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => CurrentPage < TotalPages;
    public bool HasPreviousPage => CurrentPage > 1;

    public PagedResult<TOut> Map<TOut>(Func<T, TOut> mapper) =>
    new([.. Items.Select(mapper)], TotalCount, CurrentPage, PageSize);

    public static async Task<PagedResult<T>> CreateAsync(
        IQueryable<T> query,
        int page,
        int pageSize)
    {
        var totalCount = await query.CountAsync();

        // (page - 1) * pageSize overflows int for a large page number and wraps negative, which
        // Skip rejects at runtime. Compute in long and clamp: a page past the end is an empty
        // result, not an error.
        var skip = Math.Min((long)(page - 1) * pageSize, int.MaxValue);

        var items = skip >= totalCount
            ? []
            : await query
                .Skip((int)skip)
                .Take(pageSize)
                .ToListAsync();

        return new PagedResult<T>(items, totalCount, page, pageSize);
    }
}
