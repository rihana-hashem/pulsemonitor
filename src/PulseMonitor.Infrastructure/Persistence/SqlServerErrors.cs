using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace PulseMonitor.Infrastructure.Persistence;

internal static class SqlServerErrors
{
    // SQL Server error numbers for unique index / unique constraint violations.
    private const int UniqueIndexViolation = 2601;
    private const int UniqueConstraintViolation = 2627;

    /// <summary>True when the save failed because a unique index or constraint was violated.</summary>
    public static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException
        {
            Number: UniqueIndexViolation or UniqueConstraintViolation
        };
}
