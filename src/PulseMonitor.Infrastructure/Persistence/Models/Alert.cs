using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class Alert
{
    public long AlertId { get; set; }

    public int ServerId { get; set; }

    public string MetricType { get; set; } = null!;

    public decimal ThresholdValue { get; set; }

    public decimal TriggerValue { get; set; }

    public decimal? LastObservedValue { get; set; }

    public string Status { get; set; } = null!;

    public DateTime TriggeredAt { get; set; }

    public DateTime? LastObservedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public virtual Server Server { get; set; } = null!;
}
