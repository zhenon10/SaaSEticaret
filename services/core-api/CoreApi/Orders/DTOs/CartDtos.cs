using System.ComponentModel.DataAnnotations;

namespace CoreApi.Orders.DTOs;

public class AddToCartRequest
{
    [Required]
    public Guid ProductId { get; set; }

    [MaxLength(100)]
    public string? Color { get; set; }

    [MaxLength(50)]
    public string? Size { get; set; }

    [Required]
    [Range(1, 1000)]
    public int Quantity { get; set; }
}

public class UpdateCartItemRequest
{
    [Required]
    [Range(1, 1000)]
    public int Quantity { get; set; }
}

public class CartItemResponse
{
    public Guid    Id           { get; set; }
    public Guid    ProductId    { get; set; }
    public string  ProductName  { get; set; } = string.Empty;
    public string  ProductSlug  { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public string? Sku          { get; set; }
    public string? Color        { get; set; }
    public string? Size         { get; set; }
    public int     Quantity     { get; set; }
    public decimal UnitPrice    { get; set; }
    public decimal LineTotal    { get; set; }
    public bool    IsAvailable  { get; set; }  // false if product became inactive/out of stock
    public int     AvailableQty { get; set; }
}

public class CartResponse
{
    public Guid                  Id         { get; set; }
    public List<CartItemResponse> Items     { get; set; } = new();
    public decimal               Subtotal   { get; set; }
    public int                   ItemCount  { get; set; }
    public DateTime?             UpdatedAt  { get; set; }
}
