using System.Text.Json;
using CoreApi.Catalog.Entities;
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
        ["store.name"]                 = "mağaza",
        ["store.color.primary"]        = "#f97316",
        ["hero.image"]                 = "",
        ["hero.badge"]                 = "Yeni Sezon Koleksiyonu",
        ["hero.title"]                 = "Trendleri Yakala",
        ["hero.subtitle"]              = "Binlerce ürün, uygun fiyatlarla kapınıza kadar",
        ["hero.buttons"]               = """[{"text":"Alışverişe Başla","href":"/products","variant":"solid"},{"text":"Öne Çıkanlar","href":"/products?featured=1","variant":"outline"}]""",
        ["announcement.enabled"]       = "true",
        ["announcement.text"]          = "🚀 Ücretsiz kargo 150 TL ve üzeri siparişlerde geçerlidir!",
        ["campaign.shipping.title"]    = "Ücretsiz Kargo",
        ["campaign.shipping.subtitle"] = "150 TL ve üzeri siparişlerde",
        ["campaign.return.title"]      = "Kolay İade",
        ["campaign.return.subtitle"]   = "30 gün içinde ücretsiz iade",
        ["campaign.payment.title"]     = "Güvenli Ödeme",
        ["campaign.payment.subtitle"]  = "SSL ile şifrelenmiş ödeme",
        ["nav.links"]                  = """[{"label":"Yeni Gelenler","href":"/products"},{"label":"Öne Çıkanlar","href":"/products?featured=1"},{"label":"İndirimli Ürünler","href":"/products"},{"label":"Kadın Giyim","href":"/products"},{"label":"Erkek Giyim","href":"/products"},{"label":"Çocuk","href":"/products"},{"label":"Aksesuar","href":"/products"}]""",
        ["footer.description"]         = "Türkiye'nin güvenilir online alışveriş platformu. Binlerce ürün, uygun fiyat.",
        ["footer.contact.email"]       = "destek@magaza.com",
        ["footer.contact.phone"]       = "0850 000 00 00",
        ["footer.contact.hours"]       = "Hafta içi 09:00 – 18:00",
        ["footer.copyright"]           = "Tüm hakları saklıdır.",
        ["footer.columns"]             = """[{"title":"Alışveriş","links":[{"label":"Tüm Ürünler","href":"/products"},{"label":"Öne Çıkanlar","href":"/products?featured=1"},{"label":"Yeni Gelenler","href":"/products"},{"label":"İndirimli Ürünler","href":"/products"}]},{"title":"Hesabım","links":[{"label":"Giriş Yap","href":"/login"},{"label":"Siparişlerim","href":"/account/orders"},{"label":"Sepetim","href":"/cart"}]}]""",
        ["footer.legal"]               = """[{"label":"Gizlilik Politikası","href":"/privacy"},{"label":"Kullanım Koşulları","href":"/terms"},{"label":"KVKK","href":"/kvkk"}]""",
        ["shipping.fee"]               = "49.90",
        ["shipping.free_threshold"]    = "500.00",
    };

    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.MigrateAsync();

        if (await context.Roles.AnyAsync())
        {
            await SeedMissingSettingsAsync(context);
            return;
        }

        // ==================== ROLES ====================

        var adminRole    = new Role { Id = Guid.NewGuid(), Name = "Admin",    CreatedAt = DateTime.UtcNow };
        var staffRole    = new Role { Id = Guid.NewGuid(), Name = "Staff",    CreatedAt = DateTime.UtcNow };
        var customerRole = new Role { Id = Guid.NewGuid(), Name = "Customer", CreatedAt = DateTime.UtcNow };
        context.Roles.AddRange(adminRole, staffRole, customerRole);

        // ==================== ADMIN USER ====================

        var adminUser = new User
        {
            Id        = Guid.NewGuid(),
            Email     = "admin@magaza.com",
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
                Key       = key,
                Value     = value,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        // ==================== CATEGORIES & PRODUCTS ====================

        var topCategory = new Category
        {
            Id           = Guid.NewGuid(),
            Name         = "Üst Giyim",
            Slug         = "ust-giyim",
            Description  = "Tişörtler, gömlekler ve diğer üst giyim",
            DisplayOrder = 1,
            CreatedAt    = DateTime.UtcNow
        };
        context.Categories.Add(topCategory);

        var product = new Product
        {
            Id             = Guid.NewGuid(),
            CategoryId     = topCategory.Id,
            Name           = "Premium Pamuklu Tişört",
            Slug           = "premium-pamuklu-tisort",
            Description    = "%100 Organik Pamuk, Yumuşak ve Rahat, Tüm Sezonlar İçin Uygun",
            Price          = 299.99m,
            CompareAtPrice = 399.99m,
            Sku            = "TSHIRT-001",
            IsActive       = true,
            IsFeatured     = true,
            OptionsJson    = JsonSerializer.Serialize(new { Colors = new[] { "Beyaz", "Siyah", "Gri", "Mavi" }, Sizes = new[] { "XS", "S", "M", "L", "XL", "XXL" } }),
            CreatedAt      = DateTime.UtcNow
        };
        context.Products.Add(product);

        context.Inventories.Add(new Inventory
        {
            Id                = Guid.NewGuid(),
            ProductId         = product.Id,
            Quantity          = 100,
            ReservedQuantity  = 0,
            LowStockThreshold = 10,
            CreatedAt         = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        Console.WriteLine($"[Seed] Admin   : {adminUser.Email}");
        Console.WriteLine($"[Seed] Settings: {DefaultSettings.Count} defaults seeded");
        Console.WriteLine($"[Seed] Products: 1 product seeded");
    }

    private static async Task SeedMissingSettingsAsync(ApplicationDbContext context)
    {
        var existingKeys = (await context.SiteSettings.Select(s => s.Key).ToListAsync()).ToHashSet();

        var missing = DefaultSettings.Where(kv => !existingKeys.Contains(kv.Key)).ToList();
        if (missing.Count == 0) return;

        foreach (var (key, value) in missing)
        {
            context.SiteSettings.Add(new SiteSetting
            {
                Key       = key,
                Value     = value,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        await context.SaveChangesAsync();
        Console.WriteLine($"[Seed] Settings: {missing.Count} missing defaults backfilled");
    }
}
