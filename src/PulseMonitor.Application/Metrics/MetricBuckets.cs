namespace PulseMonitor.Application.Metrics;

/// <summary>
/// Chooses how many minutes of raw metrics (collected once a minute) to aggregate into one
/// chart point, so a chart never gets more than <see cref="MaxPoints"/> points.
/// </summary>
public static class MetricBuckets
{
    public const int MaxPoints = 360;

    // Round sizes keep bucket boundaries on familiar times (e.g. :00, :15, :30, :45).
    private static readonly int[] SizesInMinutes = [1, 2, 5, 10, 15, 30, 60, 120, 180, 360, 720, 1440];

    /// <summary>Bucket boundaries are counted from this fixed instant, so they do not shift between requests.</summary>
    public static readonly DateTime Origin = new(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static int ChooseSizeInMinutes(TimeSpan range)
    {
        if (range <= TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(range), range, "The range must be positive.");

        var minimumSize = range.TotalMinutes / MaxPoints;

        foreach (var size in SizesInMinutes)
        {
            if (size >= minimumSize)
                return size;
        }

        return SizesInMinutes[^1];
    }
}
