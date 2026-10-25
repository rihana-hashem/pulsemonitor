using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class Metric
{
    public long MetricId { get; set; }

    public int ServerId { get; set; }

    public decimal CpuUsage { get; set; }

    public decimal MemoryUsage { get; set; }

    public decimal DiskUsage { get; set; }

    public int ResponseTimeMs { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CollectedAt { get; set; }

    public virtual Server Server { get; set; } = null!;
}
