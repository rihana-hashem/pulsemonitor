using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Infrastructure.Auth;

/// <summary>Creates the first Admin account at startup if none exists.</summary>
internal sealed class AdminBootstrapper(
    IServiceScopeFactory scopeFactory,
    IOptions<AdminBootstrapOptions> options,
    ILogger<AdminBootstrapper> logger) : IHostedService
{
    private const int MinPasswordLength = 12;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await EnsureAdminExistsAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // The API is still useful without it (e.g. the database is briefly unavailable).
            logger.LogError(ex, "Could not check or create the bootstrap admin account");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task EnsureAdminExistsAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PulseMonitorDbContext>();

        var adminExists = await dbContext.UserRoles.AnyAsync(
            ur => ur.Role.RoleName == RoleNames.Admin && ur.User.IsActive,
            cancellationToken);

        if (adminExists)
            return;

        var settings = options.Value;

        if (string.IsNullOrWhiteSpace(settings.Password))
        {
            logger.LogWarning(
                "No admin account exists and {Setting} is not set; nobody can manage servers or users",
                $"{AdminBootstrapOptions.SectionName}:Password");
            return;
        }

        if (settings.Password.Length < MinPasswordLength)
        {
            logger.LogError(
                "Bootstrap admin not created: the configured password must be at least {MinLength} characters",
                MinPasswordLength);
            return;
        }

        var adminRole = await dbContext.Roles
            .SingleAsync(r => r.RoleName == RoleNames.Admin, cancellationToken);

        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        var admin = new User
        {
            UserName = settings.UserName,
            Email = settings.Email.ToLowerInvariant(),
            IsActive = true
        };
        admin.PasswordHash = hasher.HashPassword(admin, settings.Password);
        admin.UserRoles.Add(new UserRole { Role = adminRole });

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Created bootstrap admin account {UserName}; change its password after first sign-in",
            admin.UserName);
    }
}
