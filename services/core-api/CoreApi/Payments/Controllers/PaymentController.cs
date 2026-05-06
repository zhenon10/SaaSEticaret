using CoreApi.Infrastructure.Persistence;
using CoreApi.Orders.Entities;
using CoreApi.Payments.Entities;
using CoreApi.Payments.Services;
using CoreApi.Payments.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CoreApi.Payments.Controllers;

[ApiController]
[Route("payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService            _paymentService;
    private readonly IOptions<IyzicoSettings>   _settings;
    private readonly ApplicationDbContext       _context;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(
        IPaymentService            paymentService,
        IOptions<IyzicoSettings>   settings,
        ApplicationDbContext       context,
        ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _settings       = settings;
        _context        = context;
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

    [AllowAnonymous]
    [HttpPost("bank-transfer/{orderId:guid}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> InitiateBankTransfer(Guid orderId)
    {
        Guid? userId = User.Identity?.IsAuthenticated == true ? GetUserId() : null;

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == orderId &&
                (userId == null ? o.UserId == null : o.UserId == userId));

        if (order is null)
            return NotFound(new { error = "Sipariş bulunamadı." });

        if (order.Status != OrderStatus.Pending)
            return BadRequest(new { error = "Sadece bekleyen siparişler için ödeme yapılabilir." });

        order.PaymentMethod = PaymentMethod.BankTransfer;

        var transaction = new PaymentTransaction
        {
            OrderId   = order.Id,
            Token     = Guid.NewGuid().ToString("N"),
            Status    = "pending",
            Method    = "bank_transfer",
            Amount    = order.TotalAmount,
            Currency  = order.Currency,
            CreatedAt = DateTime.UtcNow,
        };
        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        var bankSettings = await _context.SiteSettings
            .Where(s => s.Key.StartsWith("payment.bank."))
            .ToDictionaryAsync(s => s.Key, s => s.Value ?? "");

        string get(string key, string fallback = "") =>
            bankSettings.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v : fallback;

        return Ok(new
        {
            orderNumber   = order.OrderNumber,
            amount        = order.TotalAmount,
            currency      = order.Currency,
            bankName      = get("payment.bank.name",           "Belirtilmemiş"),
            branch        = get("payment.bank.branch"),
            accountHolder = get("payment.bank.account_holder", "Belirtilmemiş"),
            iban          = get("payment.bank.iban",           "Belirtilmemiş"),
            description   = get("payment.bank.description"),
        });
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}
