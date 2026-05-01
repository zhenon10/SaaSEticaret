using CoreApi.Domain.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Application.Tenancy;

public interface ITenantResolver
{
    Task<Tenant?> ResolveAsync(HttpContext context);
}

public class TenantResolver : ITenantResolver
{
    private readonly ApplicationDbContext _context;
    
    public TenantResolver(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Tenant?> ResolveAsync(HttpContext context)
    {
        var host = (context.Request.Host.Host ?? string.Empty).ToLowerInvariant();

        // Strip prefixes
        if (host.StartsWith("api."))
            host = host[4..];
        else if (host.StartsWith("admin."))
            host = host[6..];
        
        // Check for custom domain match (only verified domains)
        var customDomain = await _context.TenantDomains
            .Where(d => d.Domain == host && d.Status == DomainStatus.Verified)
            .Select(d => d.Tenant)
            .FirstOrDefaultAsync();
        
        if (customDomain != null)
            return customDomain;
        
        // Resolve from subdomain (tenantSlug)
        var firstDot = host.IndexOf('.');
        var subdomain = firstDot > 0 ? host[..firstDot] : host;
        
        if (!string.IsNullOrEmpty(subdomain) && subdomain != "mbftech" && subdomain != "localhost")
        {
            return await _context.Tenants
                .FirstOrDefaultAsync(t => t.Slug == subdomain);
        }

        // Development fallback: resolve tenant from X-Tenant-Slug header
        if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var slugHeader))
        {
            var slug = slugHeader.ToString().ToLowerInvariant();
            if (!string.IsNullOrEmpty(slug))
                return await _context.Tenants.FirstOrDefaultAsync(t => t.Slug == slug);
        }

        return null;
    }
}