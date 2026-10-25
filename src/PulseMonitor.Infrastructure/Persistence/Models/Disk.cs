using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class Disk
{
    public int DiskId { get; set; }

    public int ServerId { get; set; }

    public string DriveLetter { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<DiskMetric> DiskMetrics { get; set; } = new List<DiskMetric>();

    public virtual Server Server { get; set; } = null!;
}
