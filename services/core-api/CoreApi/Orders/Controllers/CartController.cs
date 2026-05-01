using CoreApi.Application.Tenancy;
using CoreApi.Orders.DTOs;
using CoreApi.Orders.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Orders.Controllers;

[ApiController]
[Route("orders/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    private readonly ITenantContext _tenantContext;

    public CartController(ICartService cartService, ITenantContext tenantContext)
    {
        _cartService   = cartService;
        _tenantContext = tenantContext;
    }

    /// <summary>GET /orders/cart</summary>
    [HttpGet]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart()
    {
        if (!_tenantContext.IsSet) return BadRequest(new { error = "Tenant context not found" });
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var cart = await _cartService.GetCartAsync(userId.Value);
        return Ok(cart);
    }

    /// <summary>POST /orders/cart/items</summary>
    [HttpPost("items")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Invalid request", details = ModelState });
        if (!_tenantContext.IsSet) return BadRequest(new { error = "Tenant context not found" });
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var cart = await _cartService.AddItemAsync(userId.Value, request);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>PUT /orders/cart/items/{itemId}</summary>
    [HttpPut("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateItem(Guid itemId, [FromBody] UpdateCartItemRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Invalid request", details = ModelState });
        if (!_tenantContext.IsSet) return BadRequest(new { error = "Tenant context not found" });
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var cart = await _cartService.UpdateItemAsync(userId.Value, itemId, request);
            return cart is null ? NotFound() : Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>DELETE /orders/cart/items/{itemId}</summary>
    [HttpDelete("items/{itemId:guid}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveItem(Guid itemId)
    {
        if (!_tenantContext.IsSet) return BadRequest(new { error = "Tenant context not found" });
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var cart = await _cartService.RemoveItemAsync(userId.Value, itemId);
        return cart is null ? NotFound() : Ok(cart);
    }

    /// <summary>DELETE /orders/cart</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ClearCart()
    {
        if (!_tenantContext.IsSet) return BadRequest(new { error = "Tenant context not found" });
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        await _cartService.ClearCartAsync(userId.Value);
        return NoContent();
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
