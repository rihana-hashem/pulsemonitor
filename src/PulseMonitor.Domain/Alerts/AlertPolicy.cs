namespace PulseMonitor.Domain.Alerts;

public static class AlertPolicy
{
    public static AlertAction Evaluate(
        decimal currentValue,
        decimal threshold,
        bool hasActiveAlert)
    {
        if (currentValue >= threshold)
        {
            return hasActiveAlert
                ? AlertAction.None
                : AlertAction.Trigger;
        }

        return hasActiveAlert
            ? AlertAction.Resolve
            : AlertAction.None;
    }
}