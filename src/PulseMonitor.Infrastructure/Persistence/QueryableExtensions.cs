using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using PulseMonitor.Application.Common.Models;

namespace PulseMonitor.Infrastructure.Persistence;

internal static class QueryableExtensions
{
    public static IOrderedQueryable<T> OrderByDirection<T, TKey>(
        this IQueryable<T> source,
        Expression<Func<T, TKey>> keySelector,
        SortDirection direction)
    {
        return direction == SortDirection.Desc
            ? source.OrderByDescending(keySelector)
            : source.OrderBy(keySelector);
    }

    /// <summary>
    /// Runs a COUNT and a single-page query. <paramref name="source"/> must already be
    /// ordered (with a unique tie-breaker), otherwise pages can overlap or skip rows.
    /// </summary>
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> source,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var totalCount = await source.CountAsync(cancellationToken);

        var items = await source
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, page, pageSize, totalCount);
    }
}
