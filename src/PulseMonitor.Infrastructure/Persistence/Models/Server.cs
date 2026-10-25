using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class Server
{
    public int ServerId { get; set; }

    public string ServerName { get; set; } = null!;

    public string IpAddress { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<Alert> Alerts { get; set; } = new List<Alert>();

    public virtual ICollection<Disk> Disks { get; set; } = new List<Disk>();

    public virtual ICollection<Metric> Metrics { get; set; } = new List<Metric>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();
}
