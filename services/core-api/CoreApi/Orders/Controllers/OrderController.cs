using CoreApi.Orders.DTOs;
using CoreApi.Orders.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Orders.Controllers;

[ApiController]
[Route("orders")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrderController> _logger;

    public OrderController(IOrderService orderService, ILogger<OrderController> logger)
    {
        _orderService = orderService;
        _logger       = logger;
    }

    [AllowAnonymous]
    [HttpPost("guest-checkout")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GuestCheckout([FromBody] GuestCheckoutRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Invalid request", details = ModelState });
        try
        {
            var order = await _orderService.GuestCheckoutAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("checkout")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Invalid request", details = ModelState });

        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var order = await _orderService.CheckoutAsync(userId.Value, request);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<OrderListItem>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaged([FromQuery] OrderQueryFilter filter)
    {
        var userId  = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await _orderService.GetPagedAsync(userId.Value, IsStaffOrAbove(), filter);
        return Ok(result);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = GetUserId();
        var order  = await _orderService.GetByIdAsync(id, userId, IsStaffOrAbove());
        return order is null ? NotFound() : Ok(order);
    }

    [HttpGet("number/{orderNumber}")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByNumber(string orderNumber)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var order = await _orderService.GetByNumberAsync(orderNumber, userId.Value, IsStaffOrAbove());
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Invalid request", details = ModelState });

        try
        {
            var order = await _orderService.UpdateStatusAsync(id, request);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] string? reason = null)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var order = await _orderService.CancelAsync(id, userId.Value, IsStaffOrAbove(), reason);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    private bool IsStaffOrAbove() =>
        User.IsInRole("Admin") || User.IsInRole("Staff");
}
