using CoreApi.Application.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CoreApi.Infrastructure.Persistence;

public class TenantFilterInterceptor : SaveChangesInterceptor
{
    private readonly ITenantContext _tenantContext;
    
    public TenantFilterInterceptor(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }
    
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (_tenantContext.IsSet && eventData.Context != null)
        {
            foreach (var entry in eventData.Context.ChangeTracker.Entries())
            {
                if (entry.Entity is Domain.Entities.BaseEntity entity)
                {
                    if (entry.State == EntityState.Added && entity.TenantId == Guid.Empty)
                    {
                        entity.TenantId = _tenantContext.TenantId;
                    }
                }
            }
        }
        
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}

public static class TenantQueryFilterExtensions
{
    private static readonly Guid _emptyGuid = Guid.Empty;
    
    public static ModelBuilder ApplyTenantFilter<T>(this ModelBuilder modelBuilder) where T : Domain.Entities.BaseEntity
    {
        // Note: Global query filters should be applied per-entity with tenant ID parameter
        // This is a placeholder - actual implementation requires runtime tenant ID
        return modelBuilder;
    }
    
    public static IQueryable<T> WithTenantFilter<T>(this IQueryable<T> query, Guid tenantId) where T : Domain.Entities.BaseEntity
    {
        return query.Where(e => e.TenantId == tenantId);
    }
}