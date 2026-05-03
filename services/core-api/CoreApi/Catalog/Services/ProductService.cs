using CoreApi.Application.Tenancy;
using CoreApi.Catalog.DTOs;
using CoreApi.Catalog.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CoreApi.Catalog.Services;

public interface IProductService
{
    Task<PagedResult<ProductListItem>> GetPagedAsync(ProductQueryFilter filter);
    Task<ProductResponse?>             GetByIdAsync(Guid id);
    Task<ProductResponse?>             GetBySlugAsync(string slug);
    Task<ProductResponse>              CreateAsync(CreateProductRequest request);
    Task<ProductResponse?>             UpdateAsync(Guid id, UpdateProductRequest request);
    Task<bool>                         DeleteAsync(Guid id);
    Task<ProductImageResponse>         AddImageAsync(Guid productId, AddProductImageRequest request);
    Task<bool>                         RemoveImageAsync(Guid productId, Guid imageId);
    Task<InventoryResponse?>           GetInventoryAsync(Guid productId);
    Task<InventoryResponse?>           UpdateInventoryAsync(Guid productId, UpdateInventoryRequest request);
}

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<ProductService> _logger;

    public ProductService(
        ApplicationDbContext context,
        ITenantContext tenantContext,
        ILogger<ProductService> logger)
    {
        _context       = context;
        _tenantContext = tenantContext;
        _logger        = logger;
    }

    public async Task<PagedResult<ProductListItem>> GetPagedAsync(ProductQueryFilter filter)
    {
        var tenantId = _tenantContext.TenantId;

        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Inventory)
            .Where(p => p.TenantId == tenantId)
            .AsQueryable();

        // Filters
        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                (p.Sku != null && p.Sku.ToLower().Contains(term)) ||
                (p.Description != null && p.Description.ToLower().Contains(term)));
        }

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice);

        if (filter.IsFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == filter.IsFeatured);

        if (filter.IsActive.HasValue)
            query = query.Where(p => p.IsActive == filter.IsActive);

        if (filter.InStock.HasValue)
        {
            query = filter.InStock.Value
                ? query.Where(p => p.Inventory != null && p.Inventory.Quantity > p.Inventory.ReservedQuantity)
                : query.Where(p => p.Inventory == null || p.Inventory.Quantity <= p.Inventory.ReservedQuantity);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.IsFeatured)
            .ThenByDescending(p => p.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new ProductListItem
            {
                Id              = p.Id,
                Name            = p.Name,
                Slug            = p.Slug,
                Price           = p.Price,
                CompareAtPrice  = p.CompareAtPrice,
                Sku             = p.Sku,
                IsActive        = p.IsActive,
                IsFeatured      = p.IsFeatured,
                CategoryName    = p.Category != null ? p.Category.Name : string.Empty,
                PrimaryImageUrl = p.Images
                    .Where(i => i.IsPrimary)
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => i.Url)
                    .FirstOrDefault()
                    ?? p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.Url).FirstOrDefault(),
                IsInStock       = p.Inventory != null && p.Inventory.Quantity > p.Inventory.ReservedQuantity,
                AvailableQty    = p.Inventory != null ? p.Inventory.Quantity - p.Inventory.ReservedQuantity : 0,
                CreatedAt       = p.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<ProductListItem>
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = filter.Page,
            PageSize   = filter.PageSize
        };
    }

    public async Task<ProductResponse?> GetByIdAsync(Guid id)
    {
        var tenantId = _tenantContext.TenantId;
        var product = await FetchFullProductAsync(p => p.Id == id && p.TenantId == tenantId);
        return product is null ? null : MapToResponse(product);
    }

    public async Task<ProductResponse?> GetBySlugAsync(string slug)
    {
        var tenantId = _tenantContext.TenantId;
        var product = await FetchFullProductAsync(p => p.Slug == slug && p.TenantId == tenantId);
        return product is null ? null : MapToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var tenantId = _tenantContext.TenantId;

        // Validate category belongs to this tenant
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.TenantId == tenantId);
        if (category is null)
            throw new InvalidOperationException("Category not found.");

        // Slug uniqueness per tenant
        if (await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.Slug == request.Slug))
            throw new InvalidOperationException($"A product with slug '{request.Slug}' already exists.");

        // SKU uniqueness per tenant (when provided)
        if (!string.IsNullOrEmpty(request.Sku) &&
            await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.Sku == request.Sku))
            throw new InvalidOperationException($"A product with SKU '{request.Sku}' already exists.");

        var product = new Product
        {
            Id           = Guid.NewGuid(),
            TenantId     = tenantId,
            CategoryId   = request.CategoryId,
            Name         = request.Name,
            Slug         = request.Slug,
            Description  = request.Description,
            Price        = request.Price,
            CompareAtPrice = request.CompareAtPrice,
            Sku          = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku,
            OptionsJson  = SerializeProductOptions(request.Colors, request.Sizes),
            IsActive     = true,
            IsFeatured   = request.IsFeatured,
            CreatedAt    = DateTime.UtcNow
        };

        _context.Products.Add(product);

        // Always create inventory record alongside the product
        var inventory = new Inventory
        {
            Id                = Guid.NewGuid(),
            TenantId          = tenantId,
            ProductId         = product.Id,
            Quantity          = request.InitialStock,
            ReservedQuantity  = 0,
            LowStockThreshold = request.LowStockThreshold,
            CreatedAt         = DateTime.UtcNow
        };

        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} '{Slug}' created in tenant {TenantId}",
            product.Id, product.Slug, tenantId);

        product.Category  = category;
        product.Inventory = inventory;

        return MapToResponse(product);
    }

    public async Task<ProductResponse?> UpdateAsync(Guid id, UpdateProductRequest request)
    {
        var tenantId = _tenantContext.TenantId;
        var product  = await FetchFullProductAsync(p => p.Id == id && p.TenantId == tenantId);

        if (product is null)
            return null;

        if (request.CategoryId.HasValue && request.CategoryId != product.CategoryId)
        {
            var catExists = await _context.Categories
                .AnyAsync(c => c.Id == request.CategoryId && c.TenantId == tenantId);
            if (!catExists)
                throw new InvalidOperationException("Category not found.");
            product.CategoryId = request.CategoryId.Value;
        }

        if (request.Slug is not null && request.Slug != product.Slug)
        {
            if (await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.Slug == request.Slug && p.Id != id))
                throw new InvalidOperationException($"A product with slug '{request.Slug}' already exists.");
            product.Slug = request.Slug;
        }

        if (request.Sku is not null && request.Sku != product.Sku)
        {
            if (!string.IsNullOrEmpty(request.Sku) &&
                await _context.Products.AnyAsync(p => p.TenantId == tenantId && p.Sku == request.Sku && p.Id != id))
                throw new InvalidOperationException($"A product with SKU '{request.Sku}' already exists.");
            product.Sku = string.IsNullOrWhiteSpace(request.Sku) ? null : request.Sku;
        }

        var existingOptions = ParseProductOptions(product.OptionsJson);
        if (request.Colors is not null || request.Sizes is not null)
        {
            product.OptionsJson = SerializeProductOptions(
                request.Colors ?? existingOptions.Colors,
                request.Sizes ?? existingOptions.Sizes);
        }

        if (request.Name           is not null) product.Name           = request.Name;
        if (request.Description    is not null) product.Description    = request.Description;
        if (request.Price          is not null) product.Price          = request.Price.Value;
        if (request.CompareAtPrice is not null) product.CompareAtPrice = request.CompareAtPrice;
        if (request.IsFeatured     is not null) product.IsFeatured     = request.IsFeatured.Value;
        if (request.IsActive       is not null) product.IsActive       = request.IsActive.Value;

        // UpdatedAt is set automatically by DbContext.SaveChangesAsync override
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} updated in tenant {TenantId}", id, tenantId);

        return MapToResponse(product);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var tenantId = _tenantContext.TenantId;
        var product  = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

        if (product is null)
            return false;

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} deleted from tenant {TenantId}", id, tenantId);
        return true;
    }

    public async Task<ProductImageResponse> AddImageAsync(Guid productId, AddProductImageRequest request)
    {
        var tenantId = _tenantContext.TenantId;

        var productExists = await _context.Products
            .AnyAsync(p => p.Id == productId && p.TenantId == tenantId);
        if (!productExists)
            throw new InvalidOperationException("Product not found.");

        // Ensure only one primary image
        if (request.IsPrimary)
        {
            await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ExecuteUpdateAsync(s => s.SetProperty(i => i.IsPrimary, false));
        }

        var image = new ProductImage
        {
            Id           = Guid.NewGuid(),
            TenantId     = tenantId,
            ProductId    = productId,
            Url          = request.Url,
            AltText      = request.AltText,
            DisplayOrder = request.DisplayOrder,
            IsPrimary    = request.IsPrimary,
            CreatedAt    = DateTime.UtcNow
        };

        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync();

        return MapImageToResponse(image);
    }

    public async Task<bool> RemoveImageAsync(Guid productId, Guid imageId)
    {
        var tenantId = _tenantContext.TenantId;
        var image    = await _context.ProductImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId && i.TenantId == tenantId);

        if (image is null)
            return false;

        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<InventoryResponse?> GetInventoryAsync(Guid productId)
    {
        var tenantId  = _tenantContext.TenantId;
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.TenantId == tenantId);

        return inventory is null ? null : MapInventoryToResponse(inventory);
    }

    public async Task<InventoryResponse?> UpdateInventoryAsync(Guid productId, UpdateInventoryRequest request)
    {
        var tenantId  = _tenantContext.TenantId;
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.TenantId == tenantId);

        if (inventory is null)
            return null;

        inventory.Quantity          = request.Quantity;
        inventory.LowStockThreshold = request.LowStockThreshold;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Inventory updated for product {ProductId} in tenant {TenantId}", productId, tenantId);

        return MapInventoryToResponse(inventory);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Task<Product?> FetchFullProductAsync(System.Linq.Expressions.Expression<Func<Product, bool>> predicate)
        => _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images.OrderBy(i => i.DisplayOrder))
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(predicate);

    private static ProductResponse MapToResponse(Product p)
    {
        var options = ParseProductOptions(p.OptionsJson);
        return new ProductResponse
        {
            Id             = p.Id,
            CategoryId     = p.CategoryId,
            CategoryName   = p.Category?.Name ?? string.Empty,
            Category       = p.Category is null ? null : new ProductCategoryResponse
            {
                Id   = p.Category.Id,
                Name = p.Category.Name,
                Slug = p.Category.Slug
            },
            Name           = p.Name,
            Slug           = p.Slug,
            Description    = p.Description,
            Price          = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            Sku            = p.Sku,
            Colors         = options.Colors,
            Sizes          = options.Sizes,
            IsActive       = p.IsActive,
            IsFeatured     = p.IsFeatured,
            CreatedAt      = p.CreatedAt,
            UpdatedAt      = p.UpdatedAt,
            Images         = p.Images.Select(MapImageToResponse).ToList(),
            Inventory      = p.Inventory is null ? null : MapInventoryToResponse(p.Inventory)
        };
    }

    private static ProductImageResponse MapImageToResponse(ProductImage i) => new()
    {
        Id           = i.Id,
        Url          = i.Url,
        AltText      = i.AltText,
        DisplayOrder = i.DisplayOrder,
        IsPrimary    = i.IsPrimary
    };

    private static InventoryResponse MapInventoryToResponse(Inventory inv) => new()
    {
        Quantity          = inv.Quantity,
        ReservedQuantity  = inv.ReservedQuantity,
        AvailableQuantity = inv.AvailableQuantity,
        LowStockThreshold = inv.LowStockThreshold,
        IsInStock         = inv.IsInStock,
        IsLowStock        = inv.IsLowStock,
        UpdatedAt         = inv.UpdatedAt
    };

    private static ProductOptions ParseProductOptions(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return new ProductOptions();

        try
        {
            return JsonSerializer.Deserialize<ProductOptions>(raw, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new ProductOptions();
        }
        catch
        {
            return new ProductOptions();
        }
    }

    private static string? SerializeProductOptions(List<string>? colors, List<string>? sizes)
    {
        if ((colors == null || colors.Count == 0) && (sizes == null || sizes.Count == 0))
            return null;

        var options = new ProductOptions
        {
            Colors = colors ?? new List<string>(),
            Sizes = sizes ?? new List<string>()
        };

        return JsonSerializer.Serialize(options);
    }

    private class ProductOptions
    {
        public List<string> Colors { get; set; } = new();
        public List<string> Sizes  { get; set; } = new();
    }
}
