using System.Security.Cryptography;
using System.Text;
using CoreApi.Application.Tenancy;
using CoreApi.Identity.DTOs;
using CoreApi.Identity.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CoreApi.Identity.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, HttpContext httpContext);
    Task<AuthResult> LoginAsync(LoginRequest request, HttpContext httpContext);
    Task<AuthResult> RefreshAsync(RefreshRequest request, HttpContext httpContext);
    Task<AuthResult> LogoutAsync(string? refreshToken, HttpContext httpContext);
    Task<UserInfoDto?> GetCurrentUserAsync(Guid userId, Guid tenantId);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AuthService> _logger;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        ApplicationDbContext context,
        ITokenService tokenService,
        ITenantContext tenantContext,
        ILogger<AuthService> logger,
        IPasswordHasher<User> passwordHasher,
        IOptions<JwtSettings> jwtSettings)
    {
        _context        = context;
        _tokenService   = tokenService;
        _tenantContext  = tenantContext;
        _logger         = logger;
        _passwordHasher = passwordHasher;
        _jwtSettings    = jwtSettings.Value;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, HttpContext httpContext)
    {
        if (!_tenantContext.IsSet)
            return Fail("Tenant context not found");

        var tenantId = _tenantContext.TenantId;

        var emailExists = await _context.Users
            .AnyAsync(u => u.TenantId == tenantId && u.Email == request.Email);

        if (emailExists)
            return Fail("Bu e-posta adresi zaten kullanılıyor.");

        var customerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Customer" && r.TenantId == null);

        if (customerRole == null)
            return Fail("Sistem yapılandırma hatası.");

        var user = new User
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenantId,
            Email     = request.Email,
            IsActive  = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = customerRole.Id });

        var sessionId = Guid.NewGuid();
        var (accessToken, refreshToken) = _tokenService.GenerateTokenPair(user.Id, tenantId, "Customer", sessionId);

        _context.RefreshTokens.Add(new RefreshToken
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenantId,
            UserId    = user.Id,
            Token     = HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString()
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("New user registered: {UserId} in tenant {TenantId}", user.Id, tenantId);

        return new AuthResult
        {
            Success      = true,
            AccessToken  = accessToken,
            RefreshToken = refreshToken,
            User         = BuildUserInfo(user, "Customer")
        };
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, HttpContext httpContext)
    {
        if (!_tenantContext.IsSet)
            return Fail("Tenant context not found");

        var tenantId = _tenantContext.TenantId;

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.TenantId == tenantId && u.Email == request.Email);

        if (user == null)
        {
            _logger.LogWarning("Login failed: user not found for email {Email} in tenant {TenantId}",
                request.Email, tenantId);
            return Fail("Invalid credentials");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: user {UserId} is inactive", user.Id);
            return Fail("Account is disabled");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(
            user, user.PasswordHash, request.Password);

        if (verificationResult == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Login failed: invalid password for user {UserId}", user.Id);
            return Fail("Invalid credentials");
        }

        var role      = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";
        var sessionId = Guid.NewGuid();

        var (accessToken, refreshToken) = _tokenService.GenerateTokenPair(user.Id, tenantId, role, sessionId);

        _context.RefreshTokens.Add(new RefreshToken
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenantId,
            UserId    = user.Id,
            Token     = HashToken(refreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString()
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} logged in from tenant {TenantId}", user.Id, tenantId);

        return new AuthResult
        {
            Success      = true,
            AccessToken  = accessToken,
            RefreshToken = refreshToken,
            User         = BuildUserInfo(user, role)
        };
    }

    public async Task<AuthResult> RefreshAsync(RefreshRequest request, HttpContext httpContext)
    {
        if (!_tenantContext.IsSet)
            return Fail("Tenant context not found");

        var tenantId    = _tenantContext.TenantId;
        var hashedToken = HashToken(request.RefreshToken!);

        var stored = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u!.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt =>
                rt.TenantId    == tenantId &&
                rt.Token       == hashedToken &&
                rt.ExpiresAt   >  DateTime.UtcNow &&
                rt.RevokedAt   == null);

        if (stored == null)
        {
            _logger.LogWarning("Refresh failed: invalid or expired token for tenant {TenantId}", tenantId);
            return Fail("Invalid or expired refresh token");
        }

        // Cross-tenant protection: token's owner must belong to the current tenant
        if (stored.User?.TenantId != tenantId)
        {
            _logger.LogWarning("Refresh failed: tenant mismatch for token in tenant {TenantId}", tenantId);
            return Fail("Invalid refresh token");
        }

        var user = stored.User!;
        var role = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";

        // Rotate: revoke old token and issue a fresh pair
        stored.RevokedAt = DateTime.UtcNow;

        var sessionId = Guid.NewGuid();
        var (accessToken, newRefreshToken) = _tokenService.GenerateTokenPair(user.Id, tenantId, role, sessionId);

        _context.RefreshTokens.Add(new RefreshToken
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenantId,
            UserId    = user.Id,
            Token     = HashToken(newRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            IpAddress = httpContext.Connection.RemoteIpAddress?.ToString()
        });

        await _context.SaveChangesAsync();

        _logger.LogInformation("Token rotated for user {UserId}", user.Id);

        return new AuthResult
        {
            Success      = true,
            AccessToken  = accessToken,
            RefreshToken = newRefreshToken,
            User         = BuildUserInfo(user, role)
        };
    }

    public async Task<AuthResult> LogoutAsync(string? refreshToken, HttpContext httpContext)
    {
        if (!string.IsNullOrEmpty(refreshToken))
        {
            var hashedToken = HashToken(refreshToken);
            var stored = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == hashedToken && rt.RevokedAt == null);

            if (stored != null)
            {
                stored.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Refresh token revoked for user {UserId}", stored.UserId);
            }
        }

        return new AuthResult { Success = true };
    }

    public async Task<UserInfoDto?> GetCurrentUserAsync(Guid userId, Guid tenantId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);

        if (user == null)
            return null;

        var role = user.UserRoles.FirstOrDefault()?.Role?.Name ?? "Customer";
        return BuildUserInfo(user, role);
    }

    // SHA-256 is fine for hashing random tokens (not passwords); it prevents raw token exposure in the DB
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    private static AuthResult Fail(string error) => new() { Success = false, Error = error };

    private static UserInfoDto BuildUserInfo(User user, string role) => new()
    {
        Id    = user.Id,
        Email = user.Email,
        Role  = role
    };
}
