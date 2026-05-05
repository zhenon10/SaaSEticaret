using System.Security.Claims;
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
    private readonly ILogger<AuthController> _logger;
    private readonly JwtSettings _jwtSettings;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger,
        IOptions<JwtSettings> jwtSettings,
        IWebHostEnvironment env)
    {
        _authService = authService;
        _logger      = logger;
        _jwtSettings = jwtSettings.Value;
        _env         = env;
    }

    [HttpPost("register")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var result = await _authService.RegisterAsync(request, HttpContext);

        if (!result.Success)
        {
            if (result.Error?.Contains("zaten kullanılıyor") == true)
                return Conflict(new { error = result.Error });
            return BadRequest(new { error = result.Error });
        }

        if (IsMobileClient() || IsProxyRequest())
        {
            return Ok(new LoginResponse
            {
                AccessToken  = result.AccessToken!,
                RefreshToken = result.RefreshToken!,
                User         = result.User!
            });
        }

        SetAuthCookies(result.AccessToken!, result.RefreshToken!);
        return Ok(new WebLoginResponse { User = result.User! });
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var result = await _authService.LoginAsync(request, HttpContext);

        if (!result.Success)
            return Unauthorized(new { error = result.Error });

        if (IsMobileClient() || IsProxyRequest())
        {
            return Ok(new LoginResponse
            {
                AccessToken  = result.AccessToken!,
                RefreshToken = result.RefreshToken!,
                User         = result.User!
            });
        }

        SetAuthCookies(result.AccessToken!, result.RefreshToken!);
        return Ok(new WebLoginResponse { User = result.User! });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshRequest? request)
    {
        request ??= new RefreshRequest();

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

        SetAuthCookies(result.AccessToken!, result.RefreshToken!);
        return Ok(new { });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var cookieName   = IsAdminHost() ? "ad_rt" : "st_rt";
        var refreshToken = Request.Cookies[cookieName];

        await _authService.LogoutAsync(refreshToken, HttpContext);
        ClearAuthCookies();

        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userIdClaim))
            return Unauthorized(new { error = "Invalid token claims" });

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Malformed token claims" });

        var user = await _authService.GetCurrentUserAsync(userId);

        if (user == null)
            return NotFound(new { error = "User not found" });

        return Ok(user);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var userIdClaim = User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userIdClaim))
            return Unauthorized(new { error = "Invalid token claims" });

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Malformed token claims" });

        var user = await _authService.UpdateProfileAsync(userId, request);

        if (user == null)
            return NotFound(new { error = "User not found" });

        return Ok(user);
    }

    private bool IsAdminHost()
    {
        if (HttpContext.Request.Host.Value?.StartsWith("admin.", StringComparison.OrdinalIgnoreCase) ?? false)
            return true;

        var origin = HttpContext.Request.Headers.Origin.ToString();
        if (!string.IsNullOrEmpty(origin))
            return origin.Contains(":3001") || origin.StartsWith("https://admin.", StringComparison.OrdinalIgnoreCase);

        var referer = HttpContext.Request.Headers.Referer.ToString();
        return !string.IsNullOrEmpty(referer) &&
               (referer.Contains(":3001") || referer.StartsWith("https://admin.", StringComparison.OrdinalIgnoreCase));
    }

    private bool IsMobileClient() =>
        HttpContext.Request.Headers.TryGetValue("X-Client-Type", out var val) &&
        string.Equals(val.ToString(), "mobile", StringComparison.OrdinalIgnoreCase);

    private bool IsProxyRequest() =>
        HttpContext.Request.Headers.ContainsKey("X-Proxy-Request");

    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        var isAdmin           = IsAdminHost();
        var accessCookieName  = isAdmin ? "ad_at" : "st_at";
        var refreshCookieName = isAdmin ? "ad_rt" : "st_rt";
        var secure            = !_env.IsDevelopment();
        var sameSite          = secure ? SameSiteMode.None : SameSiteMode.Lax;

        Response.Cookies.Append(accessCookieName, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = secure,
            SameSite = sameSite,
            Expires  = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes)
        });

        Response.Cookies.Append(refreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure   = secure,
            SameSite = sameSite,
            Expires  = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays)
        });
    }

    private void ClearAuthCookies()
    {
        var isAdmin           = IsAdminHost();
        var accessCookieName  = isAdmin ? "ad_at" : "st_at";
        var refreshCookieName = isAdmin ? "ad_rt" : "st_rt";
        var secure            = !_env.IsDevelopment();

        var expired = new CookieOptions
        {
            HttpOnly = true,
            Secure   = secure,
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
            Expires  = DateTimeOffset.UtcNow.AddDays(-1)
        };

        Response.Cookies.Append(accessCookieName,  string.Empty, expired);
        Response.Cookies.Append(refreshCookieName, string.Empty, expired);
    }
}
