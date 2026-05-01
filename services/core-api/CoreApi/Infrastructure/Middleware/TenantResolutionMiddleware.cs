using CoreApi.Application.Tenancy;

namespace CoreApi.Infrastructure.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantResolver tenantResolver, ITenantContext tenantContext)
    {
        try
        {
            var tenant = await tenantResolver.ResolveAsync(context);

            if (tenant != null)
            {
                tenantContext.Set(tenant.Id, tenant.Slug);
                context.Items["TenantId"] = tenant.Id;
                context.Items["TenantSlug"] = tenant.Slug;

                _logger.LogDebug("Tenant resolved: {TenantSlug}", tenant.Slug);
            }
            else
            {
                _logger.LogWarning("No tenant found for host: {Host}", context.Request.Host.Value);
            }

            await _next(context);
        }
        finally
        {
            tenantContext.Clear();
        }
    }
}

public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}