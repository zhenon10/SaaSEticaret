using System;
using CoreApi.Domain.Entities;

namespace CoreApi.Identity.Entities;

public class UserAddress : BaseEntity
{
    public Guid   UserId     { get; set; }
    public string Label      { get; set; } = string.Empty; // "Ev", "İş" vb.
    public string FullName   { get; set; } = string.Empty;
    public string Phone      { get; set; } = string.Empty;
    public string Line1      { get; set; } = string.Empty;
    public string? Line2     { get; set; }
    public string City       { get; set; } = string.Empty;
    public string District   { get; set; } = string.Empty; // ilçe
    public string PostalCode { get; set; } = string.Empty;
    public string Country    { get; set; } = "Türkiye";
    public bool   IsDefault  { get; set; }

    public virtual User? User { get; set; }
}

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Phone { get; set; }
    public bool KvkkConsent { get; set; }
    public bool MarketingConsent { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<UserRole>    UserRoles    { get; set; } = new List<UserRole>();
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<UserAddress> Addresses    { get; set; } = new List<UserAddress>();
}

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    
    public virtual User? User { get; set; }
    public virtual Role? Role { get; set; }
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? IpAddress { get; set; }
    
    public virtual User? User { get; set; }
}