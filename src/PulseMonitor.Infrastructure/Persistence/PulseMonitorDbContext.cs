using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using PulseMonitor.Infrastructure.Persistence.Models;

namespace PulseMonitor.Infrastructure.Persistence;

public partial class PulseMonitorDbContext : DbContext
{
    public PulseMonitorDbContext(DbContextOptions<PulseMonitorDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Alert> Alerts { get; set; }

    public virtual DbSet<Disk> Disks { get; set; }

    public virtual DbSet<DiskMetric> DiskMetrics { get; set; }

    public virtual DbSet<Metric> Metrics { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Server> Servers { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alert>(entity =>
        {
            entity.HasIndex(e => new { e.ServerId, e.TriggeredAt }, "IX_Alerts_ServerId_TriggeredAt").IsDescending(false, true);

            entity.HasIndex(e => new { e.ServerId, e.MetricType }, "UX_Alerts_Active")
                .IsUnique()
                .HasFilter("([Status]='Triggered')");

            entity.Property(e => e.LastObservedAt).HasPrecision(3);
            entity.Property(e => e.LastObservedValue).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.MetricType).HasMaxLength(50);
            entity.Property(e => e.ResolvedAt).HasPrecision(3);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Triggered", "DF_Alerts_Status");
            entity.Property(e => e.ThresholdValue).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.TriggerValue).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.TriggeredAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Alerts_TriggeredAt");

            entity.HasOne(d => d.Server).WithMany(p => p.Alerts)
                .HasForeignKey(d => d.ServerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Alerts_Servers");
        });

        modelBuilder.Entity<Disk>(entity =>
        {
            entity.HasIndex(e => new { e.ServerId, e.DriveLetter }, "UQ_Disks_Server_Drive").IsUnique();

            entity.Property(e => e.DriveLetter).HasMaxLength(20);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_Disks_IsActive");

            entity.HasOne(d => d.Server).WithMany(p => p.Disks)
                .HasForeignKey(d => d.ServerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Disks_Servers");
        });

        modelBuilder.Entity<DiskMetric>(entity =>
        {
            entity.HasIndex(e => new { e.DiskId, e.CollectedAt }, "IX_DiskMetrics_DiskId_CollectedAt").IsDescending(false, true);

            entity.Property(e => e.CollectedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_DiskMetrics_CollectedAt");
            entity.Property(e => e.FreeSpaceMb).HasColumnName("FreeSpaceMB");
            entity.Property(e => e.TotalSpaceMb).HasColumnName("TotalSpaceMB");
            entity.Property(e => e.UsedPercentage).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Disk).WithMany(p => p.DiskMetrics)
                .HasForeignKey(d => d.DiskId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DiskMetrics_Disks");
        });

        modelBuilder.Entity<Metric>(entity =>
        {
            entity.HasIndex(e => new { e.ServerId, e.CollectedAt }, "IX_Metrics_ServerId_CollectedAt").IsDescending(false, true);

            entity.Property(e => e.CollectedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Metrics_CollectedAt");
            entity.Property(e => e.CpuUsage).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.DiskUsage).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.MemoryUsage).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(d => d.Server).WithMany(p => p.Metrics)
                .HasForeignKey(d => d.ServerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Metrics_Servers");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.FamilyId, "IX_RefreshTokens_FamilyId");

            entity.HasIndex(e => e.UserId, "IX_RefreshTokens_UserId");

            entity.HasIndex(e => e.TokenHash, "UQ_RefreshTokens_TokenHash").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_RefreshTokens_CreatedAt");
            entity.Property(e => e.ExpiresAt).HasPrecision(3);
            entity.Property(e => e.RevokedAt).HasPrecision(3);
            entity.Property(e => e.TokenHash)
                .HasMaxLength(64)
                .IsUnicode(false)
                .IsFixedLength();

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RefreshTokens_Users");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasIndex(e => new { e.RequestedByUserId, e.CreatedAt }, "IX_Reports_RequestedBy_CreatedAt").IsDescending(false, true);

            entity.Property(e => e.CompletedAt).HasPrecision(3);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Reports_CreatedAt");
            entity.Property(e => e.EndDate).HasPrecision(3);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
            entity.Property(e => e.FilePath).HasMaxLength(1000);
            entity.Property(e => e.StartDate).HasPrecision(3);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Pending", "DF_Reports_Status");

            entity.HasOne(d => d.RequestedByUser).WithMany(p => p.Reports)
                .HasForeignKey(d => d.RequestedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reports_Users");

            entity.HasOne(d => d.Server).WithMany(p => p.Reports)
                .HasForeignKey(d => d.ServerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reports_Servers");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.RoleName, "UQ_Roles_RoleName").IsUnique();

            entity.Property(e => e.Description).HasMaxLength(250);
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<Server>(entity =>
        {
            entity.HasIndex(e => e.ServerName, "UX_Servers_ServerName_Active")
                .IsUnique()
                .HasFilter("([DeletedAt] IS NULL)");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Servers_CreatedAt");
            entity.Property(e => e.DeletedAt).HasPrecision(3);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_Servers_IsActive");
            entity.Property(e => e.ServerName).HasMaxLength(150);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email, "UQ_Users_Email").IsUnique();

            entity.HasIndex(e => e.UserName, "UQ_Users_UserName").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_Users_CreatedAt");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.IsActive).HasDefaultValue(true, "DF_Users_IsActive");
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.UserName).HasMaxLength(100);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.Property(e => e.AssignedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())", "DF_UserRoles_AssignedAt");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Roles");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Users");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
