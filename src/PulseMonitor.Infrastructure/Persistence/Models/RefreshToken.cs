using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class RefreshToken
{
    public long RefreshTokenId { get; set; }

    public int UserId { get; set; }

    public string TokenHash { get; set; } = null!;

    public Guid FamilyId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
