using CoreApi.Catalog.Entities;
using CoreApi.Domain.Entities;
using CoreApi.Identity.Entities;
using CoreApi.Orders.Entities;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // ── Tenant ───────────────────────────────────────────────────────────────
    public DbSet<Tenant>       Tenants       => Set<Tenant>();
    public DbSet<TenantDomain> TenantDomains => Set<TenantDomain>();

    // ── Identity ─────────────────────────────────────────────────────────────
    public DbSet<User>         Users         => Set<User>();
    public DbSet<Role>         Roles         => Set<Role>();
    public DbSet<UserRole>     UserRoles     => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // ── Catalog ──────────────────────────────────────────────────────────────
    public DbSet<Category>     Categories    => Set<Category>();
    public DbSet<Product>      Products      => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Inventory>    Inventories   => Set<Inventory>();

    // ── Orders ───────────────────────────────────────────────────────────────
    public DbSet<Cart>      Carts      => Set<Cart>();
    public DbSet<CartItem>  CartItems  => Set<CartItem>();
    public DbSet<Order>     Orders     => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    // Auto-stamp UpdatedAt on every save for audited entities
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntityWithAudit>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== TENANT MODULE ====================

        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.ToTable("tenants");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.Slug).IsUnique();
        });

        modelBuilder.Entity<TenantDomain>(entity =>
        {
            entity.ToTable("tenant_domains");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.Domain).HasColumnName("domain").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Type).HasColumnName("type").HasConversion<string>();
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>();
            entity.Property(e => e.VerificationToken).HasColumnName("verification_token").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.VerifiedAt).HasColumnName("verified_at");

            entity.HasIndex(e => e.Domain).IsUnique();
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Domains)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== IDENTITY MODULE ====================

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();

            entity.HasMany(e => e.UserRoles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.Name);

            entity.HasMany(e => e.UserRoles)
                .WithOne(ur => ur.Role)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Token).HasColumnName("token").HasMaxLength(500).IsRequired();
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.Token);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.RevokedAt);
        });

        // ==================== CATALOG MODULE ====================

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(2000);
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            // Unique slug per tenant
            entity.HasIndex(e => new { e.TenantId, e.Slug }).IsUnique();
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.IsActive);

            // Self-referencing hierarchy
            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(300).IsRequired();
            entity.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(300).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(5000);
            entity.Property(e => e.Price).HasColumnName("price").HasColumnType("numeric(18,2)");
            entity.Property(e => e.CompareAtPrice).HasColumnName("compare_at_price").HasColumnType("numeric(18,2)");
            entity.Property(e => e.Sku).HasColumnName("sku").HasMaxLength(100);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsFeatured).HasColumnName("is_featured");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // Unique slug per tenant
            entity.HasIndex(e => new { e.TenantId, e.Slug }).IsUnique();
            // Unique SKU per tenant (filter on non-null)
            entity.HasIndex(e => new { e.TenantId, e.Sku })
                .IsUnique()
                .HasFilter("sku IS NOT NULL");
            entity.HasIndex(e => e.TenantId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.IsFeatured);
            entity.HasIndex(e => e.Price);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Images)
                .WithOne(i => i.Product)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Inventory)
                .WithOne(i => i.Product)
                .HasForeignKey<Inventory>(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("product_images");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Url).HasColumnName("url").HasMaxLength(2048).IsRequired();
            entity.Property(e => e.AltText).HasColumnName("alt_text").HasMaxLength(300);
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => new { e.ProductId, e.DisplayOrder });
        });

        modelBuilder.Entity<Inventory>(entity =>
        {
            entity.ToTable("inventories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.ReservedQuantity).HasColumnName("reserved_quantity");
            entity.Property(e => e.LowStockThreshold).HasColumnName("low_stock_threshold");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // One-to-one; product_id is unique
            entity.HasIndex(e => e.ProductId).IsUnique();
            entity.HasIndex(e => e.TenantId);
        });

        // ==================== ORDER MODULE ====================

        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("carts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // One active cart per user per tenant
            entity.HasIndex(e => new { e.TenantId, e.UserId }).IsUnique();

            entity.HasMany(e => e.Items)
                .WithOne(i => i.Cart)
                .HasForeignKey(i => i.CartId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("cart_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.CartId).HasColumnName("cart_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasColumnType("numeric(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.CartId);
            entity.HasIndex(e => new { e.CartId, e.ProductId }).IsUnique();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.OrderNumber).HasColumnName("order_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(10);
            entity.Property(e => e.Subtotal).HasColumnName("subtotal").HasColumnType("numeric(18,2)");
            entity.Property(e => e.DiscountAmount).HasColumnName("discount_amount").HasColumnType("numeric(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnName("tax_amount").HasColumnType("numeric(18,2)");
            entity.Property(e => e.ShippingAmount).HasColumnName("shipping_amount").HasColumnType("numeric(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasColumnType("numeric(18,2)");
            entity.Property(e => e.Notes).HasColumnName("notes").HasMaxLength(1000);
            entity.Property(e => e.CancelReason).HasColumnName("cancel_reason").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => new { e.TenantId, e.OrderNumber }).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.UserId });
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);

            // Owned address types — stored as flat columns in the orders table
            entity.OwnsOne(e => e.ShippingAddress, addr =>
            {
                addr.Property(a => a.FullName).HasColumnName("shipping_full_name").HasMaxLength(200);
                addr.Property(a => a.Email).HasColumnName("shipping_email").HasMaxLength(255);
                addr.Property(a => a.Phone).HasColumnName("shipping_phone").HasMaxLength(30);
                addr.Property(a => a.Line1).HasColumnName("shipping_line1").HasMaxLength(300);
                addr.Property(a => a.Line2).HasColumnName("shipping_line2").HasMaxLength(300);
                addr.Property(a => a.City).HasColumnName("shipping_city").HasMaxLength(100);
                addr.Property(a => a.State).HasColumnName("shipping_state").HasMaxLength(100);
                addr.Property(a => a.PostalCode).HasColumnName("shipping_postal_code").HasMaxLength(20);
                addr.Property(a => a.Country).HasColumnName("shipping_country").HasMaxLength(100);
            });

            entity.OwnsOne(e => e.BillingAddress, addr =>
            {
                addr.Property(a => a.FullName).HasColumnName("billing_full_name").HasMaxLength(200);
                addr.Property(a => a.Email).HasColumnName("billing_email").HasMaxLength(255);
                addr.Property(a => a.Phone).HasColumnName("billing_phone").HasMaxLength(30);
                addr.Property(a => a.Line1).HasColumnName("billing_line1").HasMaxLength(300);
                addr.Property(a => a.Line2).HasColumnName("billing_line2").HasMaxLength(300);
                addr.Property(a => a.City).HasColumnName("billing_city").HasMaxLength(100);
                addr.Property(a => a.State).HasColumnName("billing_state").HasMaxLength(100);
                addr.Property(a => a.PostalCode).HasColumnName("billing_postal_code").HasMaxLength(20);
                addr.Property(a => a.Country).HasColumnName("billing_country").HasMaxLength(100);
            });

            entity.HasMany(e => e.Items)
                .WithOne(i => i.Order)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("order_items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TenantId).HasColumnName("tenant_id");
            entity.Property(e => e.OrderId).HasColumnName("order_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.ProductName).HasColumnName("product_name").HasMaxLength(300).IsRequired();
            entity.Property(e => e.ProductSku).HasColumnName("product_sku").HasMaxLength(100);
            entity.Property(e => e.Quantity).HasColumnName("quantity");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasColumnType("numeric(18,2)");
            entity.Property(e => e.TotalPrice).HasColumnName("total_price").HasColumnType("numeric(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.OrderId);
        });
    }
}
