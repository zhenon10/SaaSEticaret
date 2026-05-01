using System;

namespace CoreApi.Domain.Entities;

public enum DomainType
{
    Primary,
    Custom
}

public enum DomainStatus
{
    Pending,
    Verified
}

public class TenantDomain
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Domain { get; set; } = string.Empty;
    public DomainType Type { get; set; }
    public DomainStatus Status { get; set; } = DomainStatus.Pending;
    public string VerificationToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VerifiedAt { get; set; }
    
    public virtual Tenant? Tenant { get; set; }
}