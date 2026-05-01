using CoreApi.Domain.Entities;
using CoreApi.Identity.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Apply any pending migrations (creates the DB if it doesn't exist).
        // Unlike EnsureCreatedAsync, this is safe across schema versions.
        await context.Database.MigrateAsync();

        if (await context.Tenants.AnyAsync())
            return;

        // ==================== TENANT ====================

        var tenant = new Tenant
        {
            Id        = Guid.NewGuid(),
            Slug      = "tenant1",
            CreatedAt = DateTime.UtcNow
        };
        context.Tenants.Add(tenant);

        context.TenantDomains.Add(new TenantDomain
        {
            Id                = Guid.NewGuid(),
            TenantId          = tenant.Id,
            Domain            = "tenant1.mbftech.com",
            Type              = DomainType.Primary,
            Status            = DomainStatus.Verified,
            VerificationToken = Guid.NewGuid().ToString("N"),
            CreatedAt         = DateTime.UtcNow,
            VerifiedAt        = DateTime.UtcNow
        });

        // ==================== ROLES (system-wide, no tenant) ====================

        var adminRole = new Role
        {
            Id        = Guid.NewGuid(),
            Name      = "Admin",
            TenantId  = null,
            CreatedAt = DateTime.UtcNow
        };
        var staffRole = new Role
        {
            Id        = Guid.NewGuid(),
            Name      = "Staff",
            TenantId  = null,
            CreatedAt = DateTime.UtcNow
        };
        var customerRole = new Role
        {
            Id        = Guid.NewGuid(),
            Name      = "Customer",
            TenantId  = null,
            CreatedAt = DateTime.UtcNow
        };

        context.Roles.AddRange(adminRole, staffRole, customerRole);

        // ==================== ADMIN USER ====================

        var adminUser = new User
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenant.Id,
            Email     = "admin@tenant1.com",
            IsActive  = true,
            CreatedAt = DateTime.UtcNow
        };

        // Use the same PBKDF2 hasher that AuthService uses at runtime — never a one-off SHA-256.
        var hasher = new PasswordHasher<User>();
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123!");

        context.Users.Add(adminUser);
        context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });

        await context.SaveChangesAsync();

        Console.WriteLine($"[Seed] Tenant : {tenant.Slug} ({tenant.Id})");
        Console.WriteLine($"[Seed] Domain : tenant1.mbftech.com");
        Console.WriteLine($"[Seed] Roles  : Admin, Staff, Customer");
        Console.WriteLine($"[Seed] Admin  : {adminUser.Email} ({adminUser.Id})");
    }
}
