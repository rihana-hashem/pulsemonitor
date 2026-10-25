using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class Report
{
    public long ReportId { get; set; }

    public int ServerId { get; set; }

    public int RequestedByUserId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Status { get; set; } = null!;

    public string? FilePath { get; set; }

    public string? ErrorMessage { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual User RequestedByUser { get; set; } = null!;

    public virtual Server Server { get; set; } = null!;
}
