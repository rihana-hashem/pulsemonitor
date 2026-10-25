using PulseMonitor.Application.Metrics;

namespace PulseMonitor.UnitTests.Application;

public sealed class MetricBucketsTests
{
    [Theory]
    [InlineData(60, 1)]          // 1 hour: raw minutes, 60 points
    [InlineData(360, 1)]         // 6 hours: exactly 360 points
    [InlineData(361, 2)]         // just over the limit
    [InlineData(1440, 5)]        // 24 hours: 288 points
    [InlineData(10_080, 30)]     // 7 days: 336 points
    [InlineData(44_640, 180)]    // 31 days: 248 points
    public void ChooseSizeInMinutes_ReturnsSmallestRoundSizeWithinPointLimit(
        int rangeMinutes,
        int expectedSize)
    {
        var size = MetricBuckets.ChooseSizeInMinutes(TimeSpan.FromMinutes(rangeMinutes));

        Assert.Equal(expectedSize, size);
        Assert.True(rangeMinutes / (double)size <= MetricBuckets.MaxPoints);
    }

    [Fact]
    public void ChooseSizeInMinutes_UsesLargestSize_WhenRangeExceedsAllSizes()
    {
        var size = MetricBuckets.ChooseSizeInMinutes(TimeSpan.FromDays(3650));

        Assert.Equal(1440, size);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    public void ChooseSizeInMinutes_Throws_WhenRangeIsNotPositive(int rangeMinutes)
    {
        Assert.Throws<ArgumentOutOfRangeException>(
            () => MetricBuckets.ChooseSizeInMinutes(TimeSpan.FromMinutes(rangeMinutes)));
    }
}
