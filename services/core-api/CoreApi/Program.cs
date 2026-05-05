using System.Text;
using CoreApi.Catalog.Services;
using CoreApi.Identity.Entities;
using CoreApi.Orders.Services;
using CoreApi.Identity.Services;
using CoreApi.Infrastructure.Data;
using CoreApi.Infrastructure.Persistence;
using CoreApi.Payments.Services;
using CoreApi.Payments.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ==================== IDENTITY ====================

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecretKey = jwtSection["SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");

if (jwtSecretKey.Length < 32)
    throw new InvalidOperationException("Jwt:SecretKey must be at least 32 characters long.");

var jwtIssuer   = jwtSection["Issuer"]   ?? "SaaSEticaret";
var jwtAudience = jwtSection["Audience"] ?? "SaaSEticaret";

// Bind full section so TokenService and AuthController get all settings via IOptions<JwtSettings>
builder.Services.Configure<JwtSettings>(jwtSection);

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// ==================== CATALOG ====================

builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();

// ==================== ORDERS ====================

builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();

// ==================== PAYMENTS ====================

builder.Services.Configure<IyzicoSettings>(builder.Configuration.GetSection("Iyzico"));
builder.Services.AddScoped<IPaymentService, IyzicoService>();

// Use ASP.NET Core Identity's PBKDF2 hasher — never plain SHA-256
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// JWT Bearer — reads from Authorization: Bearer header (mobile)
// OR falls back to the HttpOnly cookie set by the login endpoint (web)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep short claim names exactly as issued ("sub", "role", "tid", "sid")
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ValidateIssuer   = true,
            ValidIssuer      = jwtIssuer,
            ValidateAudience = true,
            ValidAudience    = jwtAudience,
            ValidateLifetime = true,
            ClockSkew        = TimeSpan.Zero,
            NameClaimType    = "sub",
            RoleClaimType    = "role"
        };

        options.Events = new JwtBearerEvents
        {
            // Web clients: read JWT from the HttpOnly cookie when no Bearer header is present
            OnMessageReceived = context =>
            {
                if (!context.Request.Headers.ContainsKey("Authorization"))
                {
                    var host   = context.Request.Host.Value ?? string.Empty;
                    var origin = context.Request.Headers.Origin.ToString();
                    var referer = context.Request.Headers.Referer.ToString();

                    var isAdmin = context.Request.Headers.ContainsKey("X-Admin-Client")
                        || host.StartsWith("admin.", StringComparison.OrdinalIgnoreCase)
                        || origin.Contains(":3001")
                        || origin.StartsWith("https://admin.", StringComparison.OrdinalIgnoreCase)
                        || referer.Contains(":3001")
                        || referer.StartsWith("https://admin.", StringComparison.OrdinalIgnoreCase);

                    var cookieName = isAdmin ? "ad_at" : "st_at";

                    if (context.Request.Cookies.TryGetValue(cookieName, out var cookieToken)
                        && !string.IsNullOrEmpty(cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly",       policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAbove",    policy => policy.RequireRole("Admin", "Staff"));
    options.AddPolicy("CustomerOrAbove", policy => policy.RequireRole("Admin", "Staff", "Customer"));
});

// ==================== DATABASE ====================

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// ==================== CORS ====================
var allowedOrigins = new[]
{
    "http://localhost:3000",
    "http://localhost:3001",
    "https://kumandacibaba.com",
    "https://www.kumandacibaba.com",
    "https://saa-s-eticaret-admin.vercel.app",
    "https://saa-s-eticaret-storefront.vercel.app",
};

var vercelOriginPattern = new System.Text.RegularExpressions.Regex(
    @"^https://[a-z0-9-]+-zhenon10s-projects\.vercel\.app$");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.SetIsOriginAllowed(origin =>
            allowedOrigins.Contains(origin) || vercelOriginPattern.IsMatch(origin))
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// ==================== RATE LIMITING ====================

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("login", limiter =>
    {
        limiter.Window      = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = builder.Environment.IsDevelopment() ? 1000 : 10;
        limiter.QueueLimit  = 0;
    });
});

// ==================== BUILD ====================

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DatabaseSeeder.SeedAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAll");
app.UseRateLimiter();

// Ensure wwwroot/uploads exists before serving static files
var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwroot, "uploads"));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwroot),
    RequestPath = ""
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "core-api" }))
    .WithName("HealthCheck");

app.MapControllers();

app.Run();
