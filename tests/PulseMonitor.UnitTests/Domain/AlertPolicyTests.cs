using PulseMonitor.Domain.Alerts;
using Xunit;

public sealed class AlertPolicyTests
{
    [Theory]
    [InlineData(65, 90, false, AlertAction.None)]
    [InlineData(92, 90, false, AlertAction.Trigger)]
    [InlineData(95, 90, true, AlertAction.None)]
    [InlineData(70, 90, true, AlertAction.Resolve)]
    [InlineData(90, 90, false, AlertAction.Trigger)]
    public void Evaluate_ReturnsExpectedAction(
        int currentValue,
        int threshold,
        bool hasActiveAlert,
        AlertAction expected)
    {
        var result = AlertPolicy.Evaluate(
            currentValue,
            threshold,
            hasActiveAlert);

        Assert.Equal(expected, result);
    }
}