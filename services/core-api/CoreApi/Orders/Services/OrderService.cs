using CoreApi.Catalog.Entities;
using CoreApi.Orders.DTOs;
using CoreApi.Orders.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Orders.Services;

public interface IOrderService
{
    Task<OrderResponse>                CheckoutAsync(Guid userId, CheckoutRequest request);
    Task<OrderResponse>                GuestCheckoutAsync(GuestCheckoutRequest request);
    Task<OrderResponse?>               GetByIdAsync(Guid orderId, Guid? userId, bool isStaff);
    Task<OrderResponse?>               GetByNumberAsync(string orderNumber, Guid userId, bool isStaff);
    Task<PagedResult<OrderListItem>>   GetPagedAsync(Guid userId, bool isStaff, OrderQueryFilter filter);
    Task<OrderResponse?>               UpdateStatusAsync(Guid orderId, UpdateOrderStatusRequest request);
    Task<OrderResponse?>               CancelAsync(Guid orderId, Guid userId, bool isStaff, string? reason);
}

public class OrderService : IOrderService
{
    private readonly ApplicationDbContext _context;
    private readonly ICartService _cartService;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        ApplicationDbContext context,
        ICartService cartService,
        ILogger<OrderService> logger)
    {
        _context     = context;
        _cartService = cartService;
        _logger      = logger;
    }

    private async Task<decimal> CalculateShippingAsync(decimal subtotal)
    {
        var settings = await _context.SiteSettings
            .Where(s => s.Key == "shipping.fee" || s.Key == "shipping.free_threshold")
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        if (!settings.TryGetValue("shipping.fee", out var feeStr) ||
            !decimal.TryParse(feeStr, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var fee))
            return 0;

        if (settings.TryGetValue("shipping.free_threshold", out var thresholdStr) &&
            decimal.TryParse(thresholdStr, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var threshold) &&
            subtotal >= threshold)
            return 0;

        return fee;
    }

    public async Task<OrderResponse> CheckoutAsync(Guid userId, CheckoutRequest request)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is null || !cart.Items.Any())
            throw new InvalidOperationException("Cart is empty.");

        var productIds = cart.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products
            .Include(p => p.Inventory)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var validationErrors = new List<string>();
        foreach (var item in cart.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                validationErrors.Add($"Product {item.ProductId} no longer exists.");
                continue;
            }
            if (!product.IsActive)
            {
                validationErrors.Add($"'{product.Name}' is no longer available.");
                continue;
            }
            var available = product.Inventory?.AvailableQuantity ?? 0;
            if (available < item.Quantity)
                validationErrors.Add($"Only {available} units of '{product.Name}' are available (requested {item.Quantity}).");
        }

        if (validationErrors.Count > 0)
            throw new InvalidOperationException(string.Join(" | ", validationErrors));

        var orderSeq    = await _context.Orders.CountAsync() + 1;
        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMM}-{orderSeq:D6}";

        var shipping = MapAddress(request.ShippingAddress);
        var billing  = request.BillingAddress is not null
            ? MapAddress(request.BillingAddress)
            : MapAddress(request.ShippingAddress);

        var subtotal     = cart.Items.Sum(i => i.UnitPrice * i.Quantity);
        var shippingFee  = await CalculateShippingAsync(subtotal);

        var order = new Order
        {
            Id              = Guid.NewGuid(),
            UserId          = userId,
            OrderNumber     = orderNumber,
            Status          = OrderStatus.Pending,
            Currency        = request.Currency,
            Subtotal        = subtotal,
            DiscountAmount  = 0,
            TaxAmount       = 0,
            ShippingAmount  = shippingFee,
            TotalAmount     = subtotal + shippingFee,
            Notes           = request.Notes,
            ShippingAddress = shipping,
            BillingAddress  = billing,
            CreatedAt       = DateTime.UtcNow
        };

        foreach (var item in cart.Items)
        {
            var product = products[item.ProductId];

            order.Items.Add(new OrderItem
            {
                Id          = Guid.NewGuid(),
                OrderId     = order.Id,
                ProductId   = item.ProductId,
                ProductName = product.Name,
                ProductSku  = product.Sku,
                Quantity    = item.Quantity,
                UnitPrice   = item.UnitPrice,
                TotalPrice  = item.UnitPrice * item.Quantity,
                CreatedAt   = DateTime.UtcNow
            });

            product.Inventory!.ReservedQuantity += item.Quantity;
        }

        _context.Orders.Add(order);
        _context.CartItems.RemoveRange(cart.Items);

        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderNumber} created for user {UserId}", orderNumber, userId);

        return MapToResponse(order);
    }

    public async Task<OrderResponse> GuestCheckoutAsync(GuestCheckoutRequest request)
    {
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Include(p => p.Inventory)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var validationErrors = new List<string>();
        foreach (var item in request.Items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            { validationErrors.Add($"Ürün bulunamadı: {item.ProductId}."); continue; }
            if (!product.IsActive)
            { validationErrors.Add($"'{product.Name}' artık satışta değil."); continue; }
            var available = product.Inventory?.AvailableQuantity ?? 0;
            if (available < item.Quantity)
                validationErrors.Add($"'{product.Name}' için yeterli stok yok (talep: {item.Quantity}, mevcut: {available}).");
        }
        if (validationErrors.Count > 0)
            throw new InvalidOperationException(string.Join(" | ", validationErrors));

        var orderSeq    = await _context.Orders.CountAsync() + 1;
        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMM}-{orderSeq:D6}";

        var shipping = MapAddress(request.ShippingAddress);
        var billing  = request.BillingAddress is not null
            ? MapAddress(request.BillingAddress)
            : MapAddress(request.ShippingAddress);

        var order = new Order
        {
            Id              = Guid.NewGuid(),
            UserId          = null,
            GuestEmail      = request.ShippingAddress.Email,
            OrderNumber     = orderNumber,
            Status          = OrderStatus.Pending,
            Currency        = request.Currency,
            DiscountAmount  = 0,
            TaxAmount       = 0,
            ShippingAmount  = 0, // set after subtotal is calculated below
            Notes           = request.Notes,
            ShippingAddress = shipping,
            BillingAddress  = billing,
            CreatedAt       = DateTime.UtcNow
        };

        decimal subtotal = 0;
        foreach (var item in request.Items)
        {
            var product   = products[item.ProductId];
            var unitPrice = product.Price;
            subtotal += unitPrice * item.Quantity;

            order.Items.Add(new OrderItem
            {
                Id          = Guid.NewGuid(),
                OrderId     = order.Id,
                ProductId   = item.ProductId,
                ProductName = product.Name,
                ProductSku  = product.Sku,
                Quantity    = item.Quantity,
                UnitPrice   = unitPrice,
                TotalPrice  = unitPrice * item.Quantity,
                CreatedAt   = DateTime.UtcNow
            });

            product.Inventory!.ReservedQuantity += item.Quantity;
        }

        var guestShipping  = await CalculateShippingAsync(subtotal);
        order.Subtotal     = subtotal;
        order.ShippingAmount = guestShipping;
        order.TotalAmount  = subtotal + guestShipping;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Guest order {OrderNumber} created for {Email}", orderNumber, order.GuestEmail);
        return MapToResponse(order);
    }

    public async Task<OrderResponse?> GetByIdAsync(Guid orderId, Guid? userId, bool isStaff)
    {
        var order = await FetchOrderAsync(o => o.Id == orderId);
        if (order is null) return null;
        // Guest orders: userId == null means request comes from payment callback or guest payment page
        if (!isStaff && userId.HasValue && order.UserId != userId) return null;
        if (!isStaff && !userId.HasValue && order.UserId.HasValue) return null; // guest can't see user orders
        return MapToResponse(order);
    }

    public async Task<OrderResponse?> GetByNumberAsync(string orderNumber, Guid userId, bool isStaff)
    {
        var order = await FetchOrderAsync(o => o.OrderNumber == orderNumber);
        if (order is null) return null;
        if (!isStaff && order.UserId != userId) return null;
        return MapToResponse(order);
    }

    public async Task<PagedResult<OrderListItem>> GetPagedAsync(Guid userId, bool isStaff, OrderQueryFilter filter)
    {
        var query = _context.Orders.AsQueryable();

        if (!isStaff)
            query = query.Where(o => o.UserId == userId);
        else if (filter.UserId.HasValue)
            query = query.Where(o => o.UserId == filter.UserId);

        if (filter.Status.HasValue)
            query = query.Where(o => o.Status == filter.Status);

        if (filter.From.HasValue)
            query = query.Where(o => o.CreatedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(o => o.CreatedAt <= filter.To.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(o => new OrderListItem
            {
                Id            = o.Id,
                OrderNumber   = o.OrderNumber,
                Status        = o.Status,
                StatusLabel   = o.Status.ToString(),
                TotalAmount   = o.TotalAmount,
                Currency      = o.Currency,
                ItemCount     = o.Items.Count,
                PaymentMethod = o.PaymentMethod,
                CreatedAt     = o.CreatedAt,
                UpdatedAt     = o.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<OrderListItem>
        {
            Items      = items,
            TotalCount = totalCount,
            Page       = filter.Page,
            PageSize   = filter.PageSize
        };
    }

    public async Task<OrderResponse?> UpdateStatusAsync(Guid orderId, UpdateOrderStatusRequest request)
    {
        var order = await FetchOrderAsync(o => o.Id == orderId);
        if (order is null) return null;

        ValidateStatusTransition(order.Status, request.Status);

        var previousStatus = order.Status;
        order.Status = request.Status;

        if (request.Status is OrderStatus.Cancelled or OrderStatus.Refunded)
            order.CancelReason = request.Reason;

        await AdjustInventoryAsync(order, previousStatus, request.Status);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderNumber} status: {From} → {To}", order.OrderNumber, previousStatus, request.Status);

        return MapToResponse(order);
    }

    public async Task<OrderResponse?> CancelAsync(Guid orderId, Guid userId, bool isStaff, string? reason)
    {
        var order = await FetchOrderAsync(o => o.Id == orderId);
        if (order is null) return null;
        if (!isStaff && order.UserId != userId) return null;

        if (order.Status is OrderStatus.Shipped or OrderStatus.Delivered or
            OrderStatus.Cancelled or OrderStatus.Refunded)
            throw new InvalidOperationException($"Cannot cancel an order in '{order.Status}' status.");

        var previousStatus = order.Status;
        order.Status       = OrderStatus.Cancelled;
        order.CancelReason = reason;

        await AdjustInventoryAsync(order, previousStatus, OrderStatus.Cancelled);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Order {OrderNumber} cancelled by user {UserId}", order.OrderNumber, userId);
        return MapToResponse(order);
    }

    private static readonly Dictionary<OrderStatus, IReadOnlySet<OrderStatus>> _allowedTransitions = new()
    {
        [OrderStatus.Pending]    = new HashSet<OrderStatus> { OrderStatus.Confirmed, OrderStatus.Cancelled },
        [OrderStatus.Confirmed]  = new HashSet<OrderStatus> { OrderStatus.Processing, OrderStatus.Cancelled },
        [OrderStatus.Processing] = new HashSet<OrderStatus> { OrderStatus.Shipped, OrderStatus.Cancelled },
        [OrderStatus.Shipped]    = new HashSet<OrderStatus> { OrderStatus.Delivered },
        [OrderStatus.Delivered]  = new HashSet<OrderStatus> { OrderStatus.Refunded },
        [OrderStatus.Cancelled]  = new HashSet<OrderStatus>(),
        [OrderStatus.Refunded]   = new HashSet<OrderStatus>()
    };

    private static void ValidateStatusTransition(OrderStatus current, OrderStatus next)
    {
        if (!_allowedTransitions.TryGetValue(current, out var allowed) || !allowed.Contains(next))
            throw new InvalidOperationException($"Cannot transition order from '{current}' to '{next}'.");
    }

    private async Task AdjustInventoryAsync(Order order, OrderStatus from, OrderStatus to)
    {
        var productIds  = order.Items.Select(i => i.ProductId).ToList();
        var inventories = await _context.Inventories
            .Where(inv => productIds.Contains(inv.ProductId))
            .ToDictionaryAsync(inv => inv.ProductId);

        foreach (var item in order.Items)
        {
            if (!inventories.TryGetValue(item.ProductId, out var inv)) continue;

            if (to is OrderStatus.Cancelled or OrderStatus.Refunded)
            {
                inv.ReservedQuantity = Math.Max(0, inv.ReservedQuantity - item.Quantity);
                if (to == OrderStatus.Refunded)
                    inv.Quantity += item.Quantity;
            }

            if (to == OrderStatus.Delivered)
            {
                inv.Quantity         = Math.Max(0, inv.Quantity - item.Quantity);
                inv.ReservedQuantity = Math.Max(0, inv.ReservedQuantity - item.Quantity);
            }
        }
    }

    private Task<Order?> FetchOrderAsync(System.Linq.Expressions.Expression<Func<Order, bool>> predicate)
        => _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(predicate);

    private static Address MapAddress(AddressDto dto) => new()
    {
        FullName   = dto.FullName,
        Email      = dto.Email,
        Phone      = dto.Phone,
        Line1      = dto.Line1,
        Line2      = dto.Line2,
        City       = dto.City,
        State      = dto.State,
        PostalCode = dto.PostalCode,
        Country    = dto.Country
    };

    private static AddressResponse MapAddressResponse(Address a) => new()
    {
        FullName   = a.FullName,
        Email      = a.Email,
        Phone      = a.Phone,
        Line1      = a.Line1,
        Line2      = a.Line2,
        City       = a.City,
        State      = a.State,
        PostalCode = a.PostalCode,
        Country    = a.Country
    };

    private static OrderResponse MapToResponse(Order o) => new()
    {
        Id              = o.Id,
        UserId          = o.UserId,
        GuestEmail      = o.GuestEmail,
        OrderNumber     = o.OrderNumber,
        Status          = o.Status,
        StatusLabel     = o.Status.ToString(),
        Currency        = o.Currency,
        Subtotal        = o.Subtotal,
        DiscountAmount  = o.DiscountAmount,
        TaxAmount       = o.TaxAmount,
        ShippingAmount  = o.ShippingAmount,
        TotalAmount     = o.TotalAmount,
        Notes           = o.Notes,
        CancelReason    = o.CancelReason,
        PaymentMethod   = o.PaymentMethod,
        CreatedAt       = o.CreatedAt,
        UpdatedAt       = o.UpdatedAt,
        ShippingAddress = MapAddressResponse(o.ShippingAddress),
        BillingAddress  = MapAddressResponse(o.BillingAddress),
        Items           = o.Items.Select(i => new OrderItemResponse
        {
            Id          = i.Id,
            ProductId   = i.ProductId,
            ProductName = i.ProductName,
            ProductSku  = i.ProductSku,
            Quantity    = i.Quantity,
            UnitPrice   = i.UnitPrice,
            TotalPrice  = i.TotalPrice
        }).ToList()
    };
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
