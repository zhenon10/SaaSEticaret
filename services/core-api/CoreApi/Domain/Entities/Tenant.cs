using System;

namespace CoreApi.Domain.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public virtual ICollection<TenantDomain> Domains { get; set; } = new List<TenantDomain>();
}