using CoreApi.Payments.Services;
using CoreApi.Payments.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CoreApi.Payments.Controllers;

[ApiController]
[Route("payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService          _paymentService;
    private readonly IOptions<IyzicoSettings> _settings;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentService          paymentService,
        IOptions<IyzicoSettings> settings,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _settings       = settings;
        _logger         = logger;
    }

    [AllowAnonymous]
    [HttpPost("initiate/{orderId:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Initiate(Guid orderId)
    {
        // Logged-in users provide their userId; guests pass null (validated in service)
        Guid? userId = User.Identity?.IsAuthenticated == true ? GetUserId() : null;

        var userIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        try
        {
            var result = await _paymentService.InitiateAsync(orderId, userId, userIp);
            return Ok(new { paymentPageUrl = result.PaymentPageUrl, token = result.Token });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ödeme başlatılırken beklenmedik hata: OrderId={OrderId}", orderId);
            return StatusCode(500, new { error = "Ödeme servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin." });
        }
    }

    // İyzico bu endpoint'e tarayıcı üzerinden form POST atar
    [AllowAnonymous]
    [HttpPost("callback")]
    public async Task<IActionResult> Callback([FromForm] string token)
    {
        var frontendUrl = _settings.Value.FrontendUrl;

        try
        {
            var result = await _paymentService.ProcessCallbackAsync(token);

            return result.Success
                ? Redirect($"{frontendUrl}/payment/result?orderId={result.OrderId}&success=true")
                : Redirect($"{frontendUrl}/payment/result?orderId={result.OrderId}&success=false&error={Uri.EscapeDataString(result.ErrorMessage ?? "Ödeme başarısız")}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Callback işlenirken hata oluştu");
            return Redirect($"{frontendUrl}/payment/result?success=false&error={Uri.EscapeDataString("Ödeme işlemi sırasında hata oluştu")}");
        }
    }

    [AllowAnonymous]
    [HttpGet("mock-confirm")]
    public async Task<IActionResult> MockConfirm([FromQuery] string token, [FromServices] IWebHostEnvironment env)
    {
        if (!env.IsDevelopment())
            return NotFound();

        var frontendUrl = _settings.Value.FrontendUrl;
        try
        {
            var result = await _paymentService.ProcessCallbackAsync(token);
            return result.Success
                ? Redirect($"{frontendUrl}/payment/result?orderId={result.OrderId}&success=true")
                : Redirect($"{frontendUrl}/payment/result?success=false&error={Uri.EscapeDataString(result.ErrorMessage ?? "Ödeme başarısız")}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[MOCK] Callback işlenirken hata");
            return Redirect($"{frontendUrl}/payment/result?success=false");
        }
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
