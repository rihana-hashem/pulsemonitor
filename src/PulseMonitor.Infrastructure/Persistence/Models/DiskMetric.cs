using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class DiskMetric
{
    public long DiskMetricId { get; set; }

    public int DiskId { get; set; }

    public long TotalSpaceMb { get; set; }

    public long FreeSpaceMb { get; set; }

    public decimal UsedPercentage { get; set; }

    public DateTime CollectedAt { get; set; }

    public virtual Disk Disk { get; set; } = null!;
}
