using CoreApi.Orders.DTOs;
using CoreApi.Orders.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Orders.Services;

public interface ICartService
{
    Task<CartResponse>   GetCartAsync(Guid userId);
    Task<CartResponse>   AddItemAsync(Guid userId, AddToCartRequest request);
    Task<CartResponse?>  UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request);
    Task<CartResponse?>  RemoveItemAsync(Guid userId, Guid itemId);
    Task                 ClearCartAsync(Guid userId);
}

public class CartService : ICartService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CartService> _logger;

    public CartService(
        ApplicationDbContext context,
        ILogger<CartService> logger)
    {
        _context = context;
        _logger  = logger;
    }

    public async Task<CartResponse> GetCartAsync(Guid userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        return await BuildCartResponseAsync(cart);
    }

    public async Task<CartResponse> AddItemAsync(Guid userId, AddToCartRequest request)
    {
        var product = await _context.Products
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive);

        if (product is null)
            throw new InvalidOperationException("Product not found or inactive.");

        var available = product.Inventory?.AvailableQuantity ?? 0;
        if (available < request.Quantity)
            throw new InvalidOperationException($"Only {available} units available.");

        var cart = await GetOrCreateCartAsync(userId);

        var normalizedColor = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color;
        var normalizedSize  = string.IsNullOrWhiteSpace(request.Size)  ? null : request.Size;

        var existing = await _context.CartItems.FirstOrDefaultAsync(i =>
            i.CartId    == cart.Id &&
            i.ProductId == request.ProductId &&
            i.Color     == normalizedColor &&
            i.Size      == normalizedSize);

        if (existing is not null)
        {
            var newQty = existing.Quantity + request.Quantity;
            if (available < newQty)
                throw new InvalidOperationException($"Only {available} units available.");
            existing.Quantity = newQty;
        }
        else
        {
            _context.CartItems.Add(new CartItem
            {
                Id        = Guid.NewGuid(),
                CartId    = cart.Id,
                ProductId = request.ProductId,
                Color     = normalizedColor,
                Size      = normalizedSize,
                Quantity  = request.Quantity,
                UnitPrice = product.Price,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Product {ProductId} added to cart for user {UserId}", request.ProductId, userId);

        return await BuildCartResponseAsync(cart);
    }

    public async Task<CartResponse?> UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request)
    {
        var cart = await GetCartOrNullAsync(userId);
        if (cart is null) return null;

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item is null) return null;

        var inventory = await _context.Inventories.FirstOrDefaultAsync(inv => inv.ProductId == item.ProductId);
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

    private async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart is not null)
            return cart;

        cart = new Cart
        {
            Id        = Guid.NewGuid(),
            UserId    = userId,
            CreatedAt = DateTime.UtcNow
        };
        _context.Carts.Add(cart);
        await _context.SaveChangesAsync();
        return cart;
    }

    private async Task<Cart?> GetCartOrNullAsync(Guid userId)
        => await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

    private async Task<CartResponse> BuildCartResponseAsync(Cart cart)
    {
        var productIds = cart.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Include(p => p.Images.Where(img => img.IsPrimary))
            .Include(p => p.Inventory)
            .Where(p => productIds.Contains(p.Id))
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
