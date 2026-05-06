using System.ComponentModel.DataAnnotations;
using CoreApi.Orders.Entities;

namespace CoreApi.Orders.DTOs;

// ── Address ───────────────────────────────────────────────────────────────────

public class AddressDto
{
    [Required]
    [MaxLength(200)]
    public string FullName   { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email      { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone      { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Line1      { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Line2     { get; set; }

    [Required]
    [MaxLength(100)]
    public string City       { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string State      { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country    { get; set; } = string.Empty;
}

// ── Checkout ──────────────────────────────────────────────────────────────────

public class CheckoutRequest
{
    [Required]
    public AddressDto ShippingAddress { get; set; } = null!;

    // When null, billing address mirrors shipping address
    public AddressDto? BillingAddress { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "TRY";
}

// ── Guest Checkout ────────────────────────────────────────────────────────────

public class GuestCheckoutItem
{
    [Required]
    public Guid   ProductId { get; set; }

    [Range(1, 100)]
    public int    Quantity  { get; set; } = 1;

    [MaxLength(100)]
    public string? Color    { get; set; }

    [MaxLength(100)]
    public string? Size     { get; set; }
}

public class GuestCheckoutRequest
{
    [Required]
    public AddressDto ShippingAddress { get; set; } = null!;

    public AddressDto? BillingAddress { get; set; }

    [Required]
    [MinLength(1)]
    public List<GuestCheckoutItem> Items { get; set; } = new();

    [MaxLength(10)]
    public string Currency { get; set; } = "TRY";

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

// ── Status update ─────────────────────────────────────────────────────────────

public class UpdateOrderStatusRequest
{
    [Required]
    public OrderStatus Status { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}

// ── Query filter ─────────────────────────────────────────────────────────────

public class OrderQueryFilter
{
    public OrderStatus? Status   { get; set; }
    public Guid?        UserId   { get; set; }  // Admin/Staff use only
    public DateTime?    From     { get; set; }
    public DateTime?    To       { get; set; }

    [Range(1, int.MaxValue)]
    public int Page     { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}

// ── Responses ─────────────────────────────────────────────────────────────────

public class AddressResponse
{
    public string  FullName   { get; set; } = string.Empty;
    public string  Email      { get; set; } = string.Empty;
    public string  Phone      { get; set; } = string.Empty;
    public string  Line1      { get; set; } = string.Empty;
    public string? Line2      { get; set; }
    public string  City       { get; set; } = string.Empty;
    public string  State      { get; set; } = string.Empty;
    public string  PostalCode { get; set; } = string.Empty;
    public string  Country    { get; set; } = string.Empty;
}

public class OrderItemResponse
{
    public Guid    Id          { get; set; }
    public Guid    ProductId   { get; set; }
    public string  ProductName { get; set; } = string.Empty;
    public string? ProductSku  { get; set; }
    public int     Quantity    { get; set; }
    public decimal UnitPrice   { get; set; }
    public decimal TotalPrice  { get; set; }
}

public class OrderListItem
{
    public Guid           Id             { get; set; }
    public string         OrderNumber    { get; set; } = string.Empty;
    public OrderStatus    Status         { get; set; }
    public string         StatusLabel    { get; set; } = string.Empty;
    public decimal        TotalAmount    { get; set; }
    public string         Currency       { get; set; } = string.Empty;
    public int            ItemCount      { get; set; }
    public PaymentMethod? PaymentMethod  { get; set; }
    public DateTime       CreatedAt      { get; set; }
    public DateTime?      UpdatedAt      { get; set; }
}

public class OrderResponse
{
    public Guid        Id             { get; set; }
    public Guid?       UserId         { get; set; }
    public string?     GuestEmail     { get; set; }
    public string      OrderNumber    { get; set; } = string.Empty;
    public OrderStatus Status         { get; set; }
    public string      StatusLabel    { get; set; } = string.Empty;
    public string      Currency       { get; set; } = string.Empty;
    public decimal     Subtotal       { get; set; }
    public decimal     DiscountAmount { get; set; }
    public decimal     TaxAmount      { get; set; }
    public decimal     ShippingAmount { get; set; }
    public decimal     TotalAmount    { get; set; }
    public string?        Notes          { get; set; }
    public string?        CancelReason   { get; set; }
    public PaymentMethod? PaymentMethod  { get; set; }
    public DateTime       CreatedAt      { get; set; }
    public DateTime?      UpdatedAt      { get; set; }

    public AddressResponse          ShippingAddress { get; set; } = null!;
    public AddressResponse          BillingAddress  { get; set; } = null!;
    public List<OrderItemResponse>  Items           { get; set; } = new();
}
