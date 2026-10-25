using Microsoft.EntityFrameworkCore;
using PulseMonitor.Infrastructure.Persistence.Models;

namespace PulseMonitor.Infrastructure.Persistence;

// Kept out of the scaffolded file so re-scaffolding the database does not remove it.
public partial class PulseMonitorDbContext
{
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        // Soft-deleted servers are hidden from every query unless IgnoreQueryFilters() is used.
        modelBuilder.Entity<Server>()
            .HasQueryFilter(server => server.DeletedAt == null);
    }
}
