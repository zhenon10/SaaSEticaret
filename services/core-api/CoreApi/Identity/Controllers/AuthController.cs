using System.Security.Claims;
using CoreApi.Application.Tenancy;
using CoreApi.Identity.DTOs;
using CoreApi.Identity.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace CoreApi.Identity.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<AuthController> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        ITenantContext tenantContext,
        ILogger<AuthController> logger,
        IOptions<JwtSettings> jwtSettings,
        IWebHostEnvironment env)
    {
        _authService    = authService;
        _tenantContext  = tenantContext;
        _logger         = logger;
        _jwtSettings    = jwtSettings.Value;
        _env            = env;
    }

    /// <summary>POST /auth/login</summary>
    /// <remarks>
    /// Web clients  → tokens stored in HttpOnly cookies (ad_at/ad_rt or st_at/st_rt).
    /// Mobile clients → tokens returned in the JSON body (send X-Client-Type: mobile).
    /// </remarks>
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var result = await _authService.LoginAsync(request, HttpContext);

        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        if (IsMobileClient())
        {
            // Mobile: tokens in JSON body — client is responsible for secure storage
            return Ok(new LoginResponse
            {
                AccessToken  = result.AccessToken!,
                RefreshToken = result.RefreshToken!,
                User         = result.User!
            });
        }

        // Web: tokens in HttpOnly cookies — never expose raw tokens in the JSON body
        SetAuthCookies(result.AccessToken!, result.RefreshToken!);
        return Ok(new WebLoginResponse { User = result.User! });
    }

    /// <summary>POST /auth/refresh</summary>
    /// <remarks>
    /// Web clients  → refresh token read from HttpOnly cookie; send an empty body {}.
    /// Mobile clients → provide {"refreshToken":"..."} in the body.
    /// </remarks>
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshRequest? request)
    {
        request ??= new RefreshRequest();

        // Web fallback: read from HttpOnly cookie when body token is absent
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            var cookieName = IsAdminHost() ? "ad_rt" : "st_rt";
            request.RefreshToken = Request.Cookies[cookieName];
        }

        if (string.IsNullOrEmpty(request.RefreshToken))
            return Unauthorized(new { error = "Refresh token required" });

        var result = await _authService.RefreshAsync(request, HttpContext);

        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        if (IsMobileClient())
        {
            return Ok(new RefreshResponse
            {
                AccessToken  = result.AccessToken!,
                RefreshToken = result.RefreshToken!
            });
        }

        // Web: rotate cookies silently
        SetAuthCookies(result.AccessToken!, result.RefreshToken!);
        return Ok(new { });
    }

    /// <summary>POST /auth/logout</summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout()
    {
        var cookieName   = IsAdminHost() ? "ad_rt" : "st_rt";
        var refreshToken = Request.Cookies[cookieName];

        await _authService.LogoutAsync(refreshToken, HttpContext);

        ClearAuthCookies();

        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>GET /auth/me</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetCurrentUser()
    {
        // With MapInboundClaims = false, claim names match exactly what the token contains
        var userIdClaim   = User.FindFirstValue("sub");
        var tenantIdClaim = User.FindFirstValue("tid");

        if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(tenantIdClaim))
            return Unauthorized(new { error = "Invalid token claims" });

        if (!Guid.TryParse(userIdClaim, out var userId) || !Guid.TryParse(tenantIdClaim, out var tokenTenantId))
            return Unauthorized(new { error = "Malformed token claims" });

        // Tenant guard: token.tid MUST match the tenant resolved from the current request host
        if (!_tenantContext.IsSet || _tenantContext.TenantId != tokenTenantId)
        {
            _logger.LogWarning(
                "Tenant mismatch: token.tid={TokenTid} request.tid={RequestTid}",
                tokenTenantId, _tenantContext.TenantId);
            return Forbid();
        }

        var user = await _authService.GetCurrentUserAsync(userId, tokenTenantId);

        if (user == null)
            return NotFound(new { error = "User not found" });

        return Ok(user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private bool IsAdminHost()
    {
        if (HttpContext.Request.Host.Value?.StartsWith("admin.", StringComparison.OrdinalIgnoreCase) ?? false)
            return true;

        // Development fallback: detect admin app via Origin or Referer header
        var origin = HttpContext.Request.Headers.Origin.ToString();
        if (!string.IsNullOrEmpty(origin))
            return origin.Contains(":3001");

        var referer = HttpContext.Request.Headers.Referer.ToString();
        return !string.IsNullOrEmpty(referer) && referer.Contains(":3001");
    }

    // Mobile clients MUST send X-Client-Type: mobile; all other clients are treated as web.
    private bool IsMobileClient() =>
        HttpContext.Request.Headers.TryGetValue("X-Client-Type", out var val) &&
        string.Equals(val.ToString(), "mobile", StringComparison.OrdinalIgnoreCase);

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isAdmin          = IsAdminHost();
        var accessCookieName = isAdmin ? "ad_at" : "st_at";
        var refreshCookieName = isAdmin ? "ad_rt" : "st_rt";

        // Secure=true in production; in development HTTP is acceptable
        var secure = !_env.IsDevelopment();

        Response.Cookies.Append(accessCookieName, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = secure,
            SameSite = SameSiteMode.Lax,
            Expires  = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes)
        });

        Response.Cookies.Append(refreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = secure,
            SameSite = SameSiteMode.Lax,
            Expires  = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });
    }

    private void ClearAuthCookies()
    {
        var isAdmin          = IsAdminHost();
        var accessCookieName = isAdmin ? "ad_at" : "st_at";
        var refreshCookieName = isAdmin ? "ad_rt" : "st_rt";

        var expired = new CookieOptions
        {
            HttpOnly = true,
            Secure   = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Expires  = DateTimeOffset.UtcNow.AddDays(-1)
        };

        Response.Cookies.Append(accessCookieName,  string.Empty, expired);
        Response.Cookies.Append(refreshCookieName, string.Empty, expired);
    }
}
