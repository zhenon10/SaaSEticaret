using System.ComponentModel.DataAnnotations;

namespace CoreApi.Catalog.DTOs;

// ── Query ────────────────────────────────────────────────────────────────────

public class ProductQueryFilter
{
    public Guid?    CategoryId  { get; set; }
    public string?  Search      { get; set; }
    public decimal? MinPrice    { get; set; }
    public decimal? MaxPrice    { get; set; }
    public bool?    InStock     { get; set; }
    public bool?    IsFeatured  { get; set; }
    public bool?    IsActive    { get; set; } = true;

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items      { get; set; } = new();
    public int     TotalCount { get; set; }
    public int     Page       { get; set; }
    public int     PageSize   { get; set; }
    public int     TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool    HasNext    => Page < TotalPages;
    public bool    HasPrev    => Page > 1;
}

// ── Requests ─────────────────────────────────────────────────────────────────

public class CreateProductRequest
{
    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug must be lowercase letters, digits, and hyphens only.")]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(5000)]
    public string? Description { get; set; }

    [Required]
    [Range(0, 999999.99)]
    public decimal Price { get; set; }

    [Range(0, 999999.99)]
    public decimal? CompareAtPrice { get; set; }

    [MaxLength(100)]
    public string? Sku { get; set; }

    public List<string>? Colors { get; set; }
    public List<string>? Sizes { get; set; }

    public bool IsFeatured { get; set; }

    [Range(0, int.MaxValue)]
    public int InitialStock { get; set; }

    [Range(0, int.MaxValue)]
    public int LowStockThreshold { get; set; } = 5;
}

public class UpdateProductRequest
{
    public Guid?    CategoryId     { get; set; }

    [MaxLength(300)]
    public string?  Name           { get; set; }

    [MaxLength(300)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug must be lowercase letters, digits, and hyphens only.")]
    public string?  Slug           { get; set; }

    [MaxLength(5000)]
    public string?  Description    { get; set; }

    [Range(0, 999999.99)]
    public decimal? Price          { get; set; }

    [Range(0, 999999.99)]
    public decimal? CompareAtPrice { get; set; }

    [MaxLength(100)]
    public string?  Sku            { get; set; }

    public List<string>? Colors { get; set; }
    public List<string>? Sizes { get; set; }

    public bool?    IsFeatured     { get; set; }
    public bool?    IsActive       { get; set; }
}

public class AddProductImageRequest
{
    [Required]
    [MaxLength(2048)]
    public string Url          { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? AltText     { get; set; }

    public int  DisplayOrder   { get; set; }
    public bool IsPrimary      { get; set; }
}

public class UpdateInventoryRequest
{
    [Required]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0, int.MaxValue)]
    public int LowStockThreshold { get; set; } = 5;
}

// ── Responses ────────────────────────────────────────────────────────────────

public class ProductListItem
{
    public Guid     Id             { get; set; }
    public string   Name           { get; set; } = string.Empty;
    public string   Slug           { get; set; } = string.Empty;
    public decimal  Price          { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string?  Sku            { get; set; }
    public bool     IsActive       { get; set; }
    public bool     IsFeatured     { get; set; }
    public string?  PrimaryImageUrl { get; set; }
    public string   CategoryName   { get; set; } = string.Empty;
    public bool     IsInStock      { get; set; }
    public int      AvailableQuantity { get; set; }
    public DateTime CreatedAt      { get; set; }
}

public class ProductResponse
{
    public Guid     Id             { get; set; }
    public Guid     CategoryId     { get; set; }
    public string   CategoryName   { get; set; } = string.Empty;
    public string   Name           { get; set; } = string.Empty;
    public string   Slug           { get; set; } = string.Empty;
    public string?  Description    { get; set; }
    public decimal  Price          { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string?  Sku            { get; set; }
    public List<string> Colors { get; set; } = new();
    public List<string> Sizes { get; set; } = new();
    public bool     IsActive       { get; set; }
    public bool     IsFeatured     { get; set; }
    public DateTime CreatedAt      { get; set; }
    public DateTime? UpdatedAt     { get; set; }

    public List<ProductImageResponse> Images    { get; set; } = new();
    public InventoryResponse?         Inventory { get; set; }
    public ProductCategoryResponse?    Category  { get; set; }
}

public class ProductCategoryResponse
{
    public Guid   Id   { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class ProductImageResponse
{
    public Guid    Id           { get; set; }
    public string  Url          { get; set; } = string.Empty;
    public string? AltText      { get; set; }
    public int     DisplayOrder { get; set; }
    public bool    IsPrimary    { get; set; }
}

public class InventoryResponse
{
    public int  Quantity          { get; set; }
    public int  ReservedQuantity  { get; set; }
    public int  AvailableQuantity { get; set; }
    public int  LowStockThreshold { get; set; }
    public bool IsInStock         { get; set; }
    public bool IsLowStock        { get; set; }
    public DateTime? UpdatedAt    { get; set; }
}
