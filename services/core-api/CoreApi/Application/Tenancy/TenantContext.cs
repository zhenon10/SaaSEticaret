namespace CoreApi.Application.Tenancy;

public interface ITenantContext
{
    Guid TenantId { get; }
    string TenantSlug { get; }
    bool IsSet { get; }
    void Set(Guid tenantId, string tenantSlug);
    void Clear();
}

public class TenantContext : ITenantContext
{
    private static readonly AsyncLocal<Guid> _tenantId = new();
    private static readonly AsyncLocal<string?> _tenantSlug = new();
    
    public Guid TenantId => _tenantId.Value;
    public string TenantSlug => _tenantSlug.Value ?? string.Empty;
    public bool IsSet => _tenantId.Value != Guid.Empty;
    
    public void Set(Guid tenantId, string tenantSlug)
    {
        _tenantId.Value = tenantId;
        _tenantSlug.Value = tenantSlug;
    }
    
    public void Clear()
    {
        _tenantId.Value = Guid.Empty;
        _tenantSlug.Value = null;
    }
}