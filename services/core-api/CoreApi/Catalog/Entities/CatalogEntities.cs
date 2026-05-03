using CoreApi.Domain.Entities;

namespace CoreApi.Catalog.Entities;

public class Category : BaseEntity
{
    public string   Name         { get; set; } = string.Empty;
    public string   Slug         { get; set; } = string.Empty;
    public string?  Description  { get; set; }
    public Guid?    ParentId     { get; set; }
    public int      DisplayOrder { get; set; }
    public bool     IsActive     { get; set; } = true;

    public Category?              Parent   { get; set; }
    public ICollection<Category>  Children { get; set; } = new List<Category>();
    public ICollection<Product>   Products { get; set; } = new List<Product>();
}

public class Product : BaseEntityWithAudit
{
    public Guid     CategoryId     { get; set; }
    public string   Name           { get; set; } = string.Empty;
    public string   Slug           { get; set; } = string.Empty;
    public string?  Description    { get; set; }
    public decimal  Price          { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public string?  Sku            { get; set; }
    public bool     IsActive       { get; set; } = true;
    public bool     IsFeatured     { get; set; }
    public string?  OptionsJson    { get; set; }

    public Category?                Category  { get; set; }
    public ICollection<ProductImage> Images   { get; set; } = new List<ProductImage>();
    public Inventory?               Inventory { get; set; }
}

public class ProductImage : BaseEntity
{
    public Guid    ProductId    { get; set; }
    public string  Url          { get; set; } = string.Empty;
    public string? AltText      { get; set; }
    public int     DisplayOrder { get; set; }
    public bool    IsPrimary    { get; set; }

    public Product? Product { get; set; }
}

public class Inventory : BaseEntityWithAudit
{
    public Guid ProductId         { get; set; }
    public int  Quantity          { get; set; }
    public int  ReservedQuantity  { get; set; }
    public int  LowStockThreshold { get; set; } = 5;

    public Product? Product { get; set; }

    // Computed — not persisted
    public int  AvailableQuantity => Quantity - ReservedQuantity;
    public bool IsInStock         => AvailableQuantity > 0;
    public bool IsLowStock        => AvailableQuantity > 0 && AvailableQuantity <= LowStockThreshold;
}
