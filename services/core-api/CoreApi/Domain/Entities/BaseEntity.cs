using System;

namespace CoreApi.Domain.Entities;

public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public abstract class BaseEntityWithAudit : BaseEntity
{
    public DateTime? UpdatedAt { get; set; }
}