using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CoreApi.Identity.DTOs;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CoreApi.Identity.Services;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, Guid tenantId, string role, Guid sessionId);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    (string accessToken, string refreshToken) GenerateTokenPair(Guid userId, Guid tenantId, string role, Guid sessionId);
}

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<TokenService> _logger;
    
    public TokenService(IOptions<JwtSettings> jwtSettings, ILogger<TokenService> logger)
    {
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }
    
    public string GenerateAccessToken(Guid userId, Guid tenantId, string role, Guid sessionId)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim("tid", tenantId.ToString()),
            new Claim("role", role),
            new Claim("sid", sessionId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };
        
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
    
    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
            
            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token validation failed");
            return null;
        }
    }
    
    public (string accessToken, string refreshToken) GenerateTokenPair(Guid userId, Guid tenantId, string role, Guid sessionId)
    {
        var accessToken = GenerateAccessToken(userId, tenantId, role, sessionId);
        var refreshToken = GenerateRefreshToken();
        return (accessToken, refreshToken);
    }
}

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SaaSEticaret";
    public string Audience { get; set; } = "SaaSEticaret";
    public int AccessTokenExpirationMinutes { get; set; } = 15;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}