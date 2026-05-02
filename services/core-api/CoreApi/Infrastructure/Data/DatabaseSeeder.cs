using CoreApi.Domain.Entities;
using CoreApi.Identity.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Infrastructure.Data;

public static class DatabaseSeeder
{
    private static readonly Dictionary<string, string> DefaultSettings = new()
    {
        ["hero.badge"]                 = "Yeni Sezon Koleksiyonu",
        ["hero.title"]                 = "Trendleri Yakala",
        ["hero.subtitle"]              = "Binlerce ürün, uygun fiyatlarla kapınıza kadar",
        ["hero.cta1.text"]             = "Alışverişe Başla",
        ["hero.cta1.href"]             = "/products",
        ["hero.cta2.text"]             = "Öne Çıkanlar",
        ["hero.cta2.href"]             = "/products?featured=1",
        ["announcement.enabled"]       = "true",
        ["announcement.text"]          = "🚀 Ücretsiz kargo 150 TL ve üzeri siparişlerde geçerlidir!",
        ["campaign.shipping.title"]    = "Ücretsiz Kargo",
        ["campaign.shipping.subtitle"] = "150 TL ve üzeri siparişlerde",
        ["campaign.return.title"]      = "Kolay İade",
        ["campaign.return.subtitle"]   = "30 gün içinde ücretsiz iade",
        ["campaign.payment.title"]     = "Güvenli Ödeme",
        ["campaign.payment.subtitle"]  = "SSL ile şifrelenmiş ödeme",
        ["nav.links"]                  = """[{"label":"Yeni Gelenler","href":"/products"},{"label":"Öne Çıkanlar","href":"/products?featured=1"},{"label":"İndirimli Ürünler","href":"/products"},{"label":"Kadın Giyim","href":"/products"},{"label":"Erkek Giyim","href":"/products"},{"label":"Çocuk","href":"/products"},{"label":"Aksesuar","href":"/products"}]""",
    };

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Apply any pending migrations (creates the DB if it doesn't exist).
        await context.Database.MigrateAsync();

        if (await context.Tenants.AnyAsync())
        {
            // Existing database — only backfill missing site settings.
            await SeedMissingSettingsAsync(context);
            return;
        }

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

        // ==================== ROLES ====================

        var adminRole = new Role { Id = Guid.NewGuid(), Name = "Admin",    TenantId = null, CreatedAt = DateTime.UtcNow };
        var staffRole = new Role { Id = Guid.NewGuid(), Name = "Staff",    TenantId = null, CreatedAt = DateTime.UtcNow };
        var customerRole = new Role { Id = Guid.NewGuid(), Name = "Customer", TenantId = null, CreatedAt = DateTime.UtcNow };
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
        var hasher = new PasswordHasher<User>();
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "Admin123!");
        context.Users.Add(adminUser);
        context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });

        // ==================== DEFAULT SITE SETTINGS ====================

        foreach (var (key, value) in DefaultSettings)
        {
            context.SiteSettings.Add(new SiteSetting
            {
                TenantId  = tenant.Id,
                Key       = key,
                Value     = value,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await context.SaveChangesAsync();

        Console.WriteLine($"[Seed] Tenant  : {tenant.Slug} ({tenant.Id})");
        Console.WriteLine($"[Seed] Admin   : {adminUser.Email}");
        Console.WriteLine($"[Seed] Settings: {DefaultSettings.Count} defaults seeded");
    }

    /// <summary>For existing databases: insert any default setting keys that are not yet present.</summary>
    private static async Task SeedMissingSettingsAsync(ApplicationDbContext context)
    {
        var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Slug == "tenant1");
        if (tenant is null) return;

        var existingKeysList = await context.SiteSettings
            .Where(s => s.TenantId == tenant.Id)
            .Select(s => s.Key)
            .ToListAsync();
        var existingKeys = existingKeysList.ToHashSet();

        var missing = DefaultSettings.Where(kv => !existingKeys.Contains(kv.Key)).ToList();
        if (missing.Count == 0) return;

        foreach (var (key, value) in missing)
        {
            context.SiteSettings.Add(new SiteSetting
            {
                TenantId  = tenant.Id,
                Key       = key,
                Value     = value,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await context.SaveChangesAsync();
        Console.WriteLine($"[Seed] Settings: {missing.Count} missing defaults backfilled");
    }
}
