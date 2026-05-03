using CoreApi.Domain.Entities;

namespace CoreApi.Orders.Entities;

public enum OrderStatus
{
    Pending,    // Created but not confirmed
    Confirmed,  // Payment/confirmation received
    Processing, // Being prepared
    Shipped,    // Dispatched
    Delivered,  // Received by customer
    Cancelled,  // Cancelled before shipping
    Refunded    // After delivery
}

// ── Address (owned type — stored as columns in the orders table) ──────────────

public class Address
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

// ── Cart ─────────────────────────────────────────────────────────────────────

public class Cart : BaseEntityWithAudit
{
    public Guid UserId { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

public class CartItem : BaseEntity
{
    public Guid    CartId      { get; set; }
    public Guid    ProductId   { get; set; }
    public string? Color       { get; set; }
    public string? Size        { get; set; }
    public int     Quantity    { get; set; }
    public decimal UnitPrice   { get; set; } // Price snapshot at time of adding

    public Cart? Cart { get; set; }

    public decimal LineTotal => UnitPrice * Quantity;
}

// ── Order ─────────────────────────────────────────────────────────────────────

public class Order : BaseEntityWithAudit
{
    public Guid        UserId         { get; set; }
    public string      OrderNumber    { get; set; } = string.Empty;
    public OrderStatus Status         { get; set; } = OrderStatus.Pending;
    public string      Currency       { get; set; } = "TRY";
    public decimal     Subtotal       { get; set; }
    public decimal     DiscountAmount { get; set; }
    public decimal     TaxAmount      { get; set; }
    public decimal     ShippingAmount { get; set; }
    public decimal     TotalAmount    { get; set; }
    public string?     Notes          { get; set; }
    public string?     CancelReason   { get; set; }

    // Owned value objects — stored as flat columns
    public Address ShippingAddress { get; set; } = new();
    public Address BillingAddress  { get; set; } = new();

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class OrderItem : BaseEntity
{
    public Guid    OrderId     { get; set; }
    public Guid    ProductId   { get; set; }
    public string  ProductName { get; set; } = string.Empty; // Snapshot
    public string? ProductSku  { get; set; }                 // Snapshot
    public int     Quantity    { get; set; }
    public decimal UnitPrice   { get; set; }                 // Snapshot
    public decimal TotalPrice  { get; set; }

    public Order? Order { get; set; }
}
