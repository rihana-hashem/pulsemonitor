using System;
using System.Collections.Generic;

namespace PulseMonitor.Infrastructure.Persistence.Models;

public partial class User
{
    public int UserId { get; set; }

    public string UserName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
