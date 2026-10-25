using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PulseMonitor.Application.Auth;
using PulseMonitor.Domain.Exceptions;
using PulseMonitor.Infrastructure.Persistence;
using PulseMonitor.Infrastructure.Persistence.Models;
using RoleNames = PulseMonitor.Domain.Users.Roles;

namespace PulseMonitor.Infrastructure.Auth;

internal sealed class AuthService(
    PulseMonitorDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    AccessTokenFactory accessTokenFactory,
    IOptions<JwtOptions> jwtOptions,
    TimeProvider timeProvider,
    ILogger<AuthService> logger) : IAuthService
{
    private const string InvalidCredentials = "Invalid user name or password.";

    // The client can only respond by signing in again, so every refresh failure looks the
    // same from outside; the real reason is logged.
    private const string SessionExpired = "Your session has expired. Please sign in again.";

    // Verified against when the user does not exist, so both cases take the same time
    // and response timing does not reveal which user names are registered.
    private static readonly Lazy<string> DummyPasswordHash =
        new(() => new PasswordHasher<User>().HashPassword(new User(), Guid.NewGuid().ToString()));

    public async Task<AuthResult> RegisterAsync(
        RegisterCommand command,
        CancellationToken cancellationToken = default)
    {
        var userName = command.UserName.Trim();
        var email = command.Email.Trim().ToLowerInvariant();

        // Compared in SQL, so case-insensitive like the unique constraints.
        if (await dbContext.Users.AnyAsync(u => u.UserName == userName, cancellationToken))
            throw new ConflictException("That user name is already taken.");

        if (await dbContext.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new ConflictException("An account with that email already exists.");

        var userRole = await dbContext.Roles
            .SingleAsync(r => r.RoleName == RoleNames.User, cancellationToken);

        var user = new User
        {
            UserName = userName,
            Email = email,
            IsActive = true
        };
        user.PasswordHash = passwordHasher.HashPassword(user, command.Password);
        user.UserRoles.Add(new UserRole { Role = userRole });

        dbContext.Users.Add(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        // Another registration took the name or email between the checks and this save.
        catch (DbUpdateException ex) when (SqlServerErrors.IsUniqueViolation(ex))
        {
            throw new ConflictException("That user name or email is already registered.");
        }

        return await IssueTokensAsync(user, [RoleNames.User], Guid.NewGuid(), cancellationToken);
    }

    public async Task<AuthResult> LoginAsync(
        LoginCommand command,
        CancellationToken cancellationToken = default)
    {
        var login = command.UserNameOrEmail.Trim();

        var user = await dbContext.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .SingleOrDefaultAsync(
                u => u.UserName == login || u.Email == login,
                cancellationToken);

        if (user is null)
        {
            passwordHasher.VerifyHashedPassword(new User(), DummyPasswordHash.Value, command.Password);
            throw new AuthenticationFailedException(InvalidCredentials);
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, command.Password);

        if (verification == PasswordVerificationResult.Failed)
            throw new AuthenticationFailedException(InvalidCredentials);

        // Only reported after a correct password, so it does not help guess accounts.
        if (!user.IsActive)
            throw new AuthenticationFailedException("This account is disabled.");

        // The stored hash uses older settings (e.g. fewer iterations); upgrade it now.
        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
            user.PasswordHash = passwordHasher.HashPassword(user, command.Password);

        var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();

        // Each sign-in starts a new refresh-token family.
        return await IssueTokensAsync(user, roles, Guid.NewGuid(), cancellationToken);
    }

    public async Task<AuthResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var tokenHash = RefreshTokenGenerator.Hash(refreshToken);

        var stored = await dbContext.RefreshTokens
            .AsNoTracking()
            .Include(t => t.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .SingleOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

        if (stored is null)
        {
            logger.LogWarning("Refresh rejected: unknown token");
            throw new AuthenticationFailedException(SessionExpired);
        }

        var now = Now;

        if (stored.RevokedAt is not null)
        {
            await RevokeStolenFamilyAsync(stored, now, cancellationToken);
            throw new AuthenticationFailedException(SessionExpired);
        }

        if (stored.ExpiresAt <= now)
        {
            logger.LogInformation("Refresh rejected: token expired for user {UserId}", stored.UserId);
            throw new AuthenticationFailedException(SessionExpired);
        }

        if (!stored.User.IsActive)
        {
            await RevokeFamilyAsync(stored.FamilyId, now, cancellationToken);
            logger.LogInformation("Refresh rejected: user {UserId} is disabled", stored.UserId);
            throw new AuthenticationFailedException("This account is disabled.");
        }

        // Revoking the old token and saving its replacement succeed or fail together.
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Atomic claim: if two requests present the same token at once, only one updates the row.
        var claimed = await dbContext.RefreshTokens
            .Where(t => t.RefreshTokenId == stored.RefreshTokenId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), cancellationToken);

        if (claimed == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            await RevokeStolenFamilyAsync(stored, now, cancellationToken);
            throw new AuthenticationFailedException(SessionExpired);
        }

        // Roles are read fresh, so role changes take effect at the next refresh.
        var roles = stored.User.UserRoles.Select(ur => ur.Role.RoleName).ToList();
        var result = await IssueTokensAsync(stored.User, roles, stored.FamilyId, cancellationToken);

        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    public async Task LogoutAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var tokenHash = RefreshTokenGenerator.Hash(refreshToken);

        var familyId = await dbContext.RefreshTokens
            .Where(t => t.TokenHash == tokenHash)
            .Select(t => (Guid?)t.FamilyId)
            .SingleOrDefaultAsync(cancellationToken);

        if (familyId is not null)
            await RevokeFamilyAsync(familyId.Value, Now, cancellationToken);
    }

    private DateTime Now => timeProvider.GetUtcNow().UtcDateTime;

    /// <summary>
    /// A token that was already rotated was presented again: it may have been stolen, and we
    /// cannot tell the thief from the real user, so the whole sign-in is ended.
    /// </summary>
    private async Task RevokeStolenFamilyAsync(
        RefreshToken token,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var revoked = await RevokeFamilyAsync(token.FamilyId, now, cancellationToken);

        // Nothing left to revoke: the sign-in already ended (logout or an earlier detection),
        // typically a stale browser tab rather than an attack.
        if (revoked == 0)
        {
            logger.LogInformation(
                "Refresh rejected: token from ended sign-in {FamilyId} used for user {UserId}",
                token.FamilyId,
                token.UserId);
            return;
        }

        logger.LogWarning(
            "Refresh token reuse detected for user {UserId}; revoked {Count} token(s) in family {FamilyId}",
            token.UserId,
            revoked,
            token.FamilyId);
    }

    private Task<int> RevokeFamilyAsync(
        Guid familyId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        return dbContext.RefreshTokens
            .Where(t => t.FamilyId == familyId && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, now), cancellationToken);
    }

    /// <summary>Creates an access token and a refresh token in the given family, and saves pending changes.</summary>
    private async Task<AuthResult> IssueTokensAsync(
        User user,
        IReadOnlyList<string> roles,
        Guid familyId,
        CancellationToken cancellationToken)
    {
        var authUser = new AuthUserDto(user.UserId, user.UserName, user.Email, roles);
        var (accessToken, accessTokenExpiresAt) = accessTokenFactory.Create(authUser);

        var now = Now;
        var refreshToken = RefreshTokenGenerator.NewToken();
        var refreshTokenExpiresAt = now.AddDays(jwtOptions.Value.RefreshTokenDays);

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.UserId,
            TokenHash = RefreshTokenGenerator.Hash(refreshToken),
            FamilyId = familyId,
            // Set here rather than by the database default, so CreatedAt and a later RevokedAt
            // come from the same clock (CK_RefreshTokens_Revocation requires RevokedAt >= CreatedAt).
            CreatedAt = now,
            ExpiresAt = refreshTokenExpiresAt
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResult(
            accessToken,
            accessTokenExpiresAt,
            refreshToken,
            refreshTokenExpiresAt,
            authUser);
    }
}
