using CoreApi.Application.Tenancy;
using CoreApi.Orders.DTOs;
using CoreApi.Orders.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Orders.Services;

public interface ICartService
{
    Task<CartResponse>  GetCartAsync(Guid userId);
    Task<CartResponse>  AddItemAsync(Guid userId, AddToCartRequest request);
    Task<CartResponse?>  UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request);
    Task<CartResponse?>  RemoveItemAsync(Guid userId, Guid itemId);
    Task                ClearCartAsync(Guid userId);
}

public class CartService : ICartService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ApplicationDbContext context,
        ITenantContext tenantContext,
        ILogger<CartService> logger)
    {
        _context       = context;
        _tenantContext = tenantContext;
        _logger        = logger;
    }

    public async Task<CartResponse> GetCartAsync(Guid userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        return await BuildCartResponseAsync(cart);
    }

    public async Task<CartResponse> AddItemAsync(Guid userId, AddToCartRequest request)
    {
        var tenantId = _tenantContext.TenantId;

        // Validate product
        var product = await _context.Products
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.TenantId == tenantId && p.IsActive);

        if (product is null)
            throw new InvalidOperationException("Product not found or inactive.");

        var available = product.Inventory?.AvailableQuantity ?? 0;
        if (available < request.Quantity)
            throw new InvalidOperationException($"Only {available} units available.");

        var cart = await GetOrCreateCartAsync(userId);

        // If product already in cart — merge quantities
        var existing = cart.Items.FirstOrDefault(i =>
            i.ProductId == request.ProductId &&
            string.Equals(i.Color, request.Color, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(i.Size, request.Size, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            var newQty = existing.Quantity + request.Quantity;
            if (available < newQty)
                throw new InvalidOperationException($"Only {available} units available.");
            existing.Quantity = newQty;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                Id        = Guid.NewGuid(),
                TenantId  = tenantId,
                CartId    = cart.Id,
                ProductId = request.ProductId,
                Color     = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color,
                Size      = string.IsNullOrWhiteSpace(request.Size) ? null : request.Size,
                Quantity  = request.Quantity,
                UnitPrice = product.Price,
                CreatedAt = DateTime.UtcNow
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency exception occurred while adding product {ProductId} to cart for user {UserId}. Retrying.", request.ProductId, userId);

            // Reload the cart and retry with the latest state.
            _context.ChangeTracker.Clear();
            cart = await GetOrCreateCartAsync(userId);

            existing = cart.Items.FirstOrDefault(i =>
                i.ProductId == request.ProductId &&
                string.Equals(i.Color, request.Color, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(i.Size, request.Size, StringComparison.OrdinalIgnoreCase));

            if (existing is not null)
            {
                var newQty = existing.Quantity + request.Quantity;
                if (available < newQty)
                    throw new InvalidOperationException($"Only {available} units available.");
                existing.Quantity = newQty;
            }
            else
            {
                cart.Items.Add(new CartItem
                {
                    Id        = Guid.NewGuid(),
                    TenantId  = tenantId,
                    CartId    = cart.Id,
                    ProductId = request.ProductId,
                    Color     = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color,
                    Size      = string.IsNullOrWhiteSpace(request.Size) ? null : request.Size,
                    Quantity  = request.Quantity,
                    UnitPrice = product.Price,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Product {ProductId} added to cart for user {UserId}", request.ProductId, userId);

        return await BuildCartResponseAsync(cart);
    }

    public async Task<CartResponse?> UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request)
    {
        var tenantId = _tenantContext.TenantId;
        var cart = await GetCartOrNullAsync(userId);
        if (cart is null) return null;

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return null;

        // Re-check stock
        var inventory = await _context.Inventories
            .FirstOrDefaultAsync(inv => inv.ProductId == item.ProductId && inv.TenantId == tenantId);

        var available = inventory?.AvailableQuantity ?? 0;
        if (available < request.Quantity)
            throw new InvalidOperationException($"Only {available} units available.");

        item.Quantity = request.Quantity;
        await _context.SaveChangesAsync();

        return await BuildCartResponseAsync(cart);
    }

    public async Task<CartResponse?> RemoveItemAsync(Guid userId, Guid itemId)
    {
        var cart = await GetCartOrNullAsync(userId);
        if (cart is null) return null;

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return null;

        _context.CartItems.Remove(item);
        await _context.SaveChangesAsync();

        cart.Items.Remove(item);
        return await BuildCartResponseAsync(cart);
    }

    public async Task ClearCartAsync(Guid userId)
    {
        var cart = await GetCartOrNullAsync(userId);
        if (cart is null) return;

        _context.CartItems.RemoveRange(cart.Items);
        await _context.SaveChangesAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var tenantId = _tenantContext.TenantId;
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);

        if (cart is not null)
            return cart;

        cart = new Cart
        {
            Id        = Guid.NewGuid(),
            TenantId  = tenantId,
            UserId    = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();
        return cart;
    }

    private async Task<Cart?> GetCartOrNullAsync(Guid userId)
    {
        var tenantId = _tenantContext.TenantId;
        return await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
    }

    private async Task<CartResponse> BuildCartResponseAsync(Cart cart)
    {
        var tenantId   = _tenantContext.TenantId;
        var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Include(p => p.Images.Where(img => img.IsPrimary))
            .Include(p => p.Inventory)
            .Where(p => productIds.Contains(p.Id) && p.TenantId == tenantId)
            .ToDictionaryAsync(p => p.Id);

        var itemResponses = cart.Items.Select(item =>
        {
            products.TryGetValue(item.ProductId, out var product);
            var available = product?.Inventory?.AvailableQuantity ?? 0;
            return new CartItemResponse
            {
                Id           = item.Id,
                ProductId    = item.ProductId,
                ProductName  = product?.Name ?? "[Removed]",
                ProductSlug  = product?.Slug ?? string.Empty,
                ProductImage = product?.Images.FirstOrDefault()?.Url,
                Sku          = product?.Sku,
                Color        = item.Color,
                Size         = item.Size,
                Quantity     = item.Quantity,
                UnitPrice    = item.UnitPrice,
                LineTotal    = item.LineTotal,
                IsAvailable  = product is { IsActive: true } && available >= item.Quantity,
                AvailableQty = available
            };
        }).ToList();

        return new CartResponse
        {
            Id        = cart.Id,
            Items     = itemResponses,
            Subtotal  = itemResponses.Sum(i => i.LineTotal),
            ItemCount = itemResponses.Sum(i => i.Quantity),
            UpdatedAt = cart.UpdatedAt
        };
    }
}
