using System.Globalization;
using CoreApi.Infrastructure.Persistence;
using CoreApi.Orders.DTOs;
using CoreApi.Orders.Entities;
using CoreApi.Orders.Services;
using CoreApi.Payments.Entities;
using CoreApi.Payments.Settings;
using Iyzipay.Model;
using Iyzipay.Request;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using IyzicoOptions = Iyzipay.Options;

namespace CoreApi.Payments.Services;

public class IyzicoService : IPaymentService
{
    private readonly ApplicationDbContext    _context;
    private readonly IOrderService           _orderService;
    private readonly IOptions<IyzicoSettings> _settings;
    private readonly ILogger<IyzicoService>  _logger;

    public IyzicoService(
        ApplicationDbContext     context,
        IOrderService            orderService,
        IOptions<IyzicoSettings> settings,
        ILogger<IyzicoService>   logger)
    {
        _context      = context;
        _orderService = orderService;
        _settings     = settings;
        _logger       = logger;
    }

    public async Task<InitiateResult> InitiateAsync(Guid orderId, Guid? userId, string? userIp)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId &&
                (userId == null ? o.UserId == null : o.UserId == userId));

        if (order is null)
            throw new InvalidOperationException("Sipariş bulunamadı.");

        if (order.Status != OrderStatus.Pending)
            throw new InvalidOperationException("Sadece bekleyen siparişler ödenebilir.");

        var s = _settings.Value;

        order.PaymentMethod = CoreApi.Orders.Entities.PaymentMethod.CreditCard;

        if (s.MockPayment)
        {
            var fakeToken = Guid.NewGuid().ToString("N");
            _context.PaymentTransactions.Add(new PaymentTransaction
            {
                OrderId  = orderId,
                Token    = fakeToken,
                Status   = "pending",
                Method   = "iyzico",
                Amount   = order.TotalAmount,
                Currency = order.Currency,
            });
            await _context.SaveChangesAsync();
            var apiBase  = new Uri(s.CallbackUrl).GetLeftPart(UriPartial.Authority);
            var mockUrl  = $"{apiBase}/payments/mock-confirm?token={fakeToken}";
            _logger.LogInformation("[MOCK] Ödeme başlatıldı: OrderId={OrderId} Token={Token}", orderId, fakeToken);
            return new InitiateResult(mockUrl, fakeToken);
        }

        var options = BuildOptions(s);

        var nameParts = order.ShippingAddress.FullName.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        var firstName = nameParts.Length > 0 ? nameParts[0] : "Ad";
        var lastName  = nameParts.Length > 1 ? nameParts[1] : "Soyad";
        var price     = order.TotalAmount.ToString("0.00", CultureInfo.InvariantCulture);

        var request = new CreateCheckoutFormInitializeRequest
        {
            Locale              = Locale.TR.ToString(),
            ConversationId      = orderId.ToString(),
            Price               = price,
            PaidPrice           = price,
            Currency            = Iyzipay.Model.Currency.TRY.ToString(),
            BasketId            = order.OrderNumber,
            PaymentGroup        = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl         = s.CallbackUrl,
            EnabledInstallments = [2, 3, 6, 9],
            Buyer = new Buyer
            {
                Id                  = (userId ?? order.Id).ToString(),
                Name                = firstName,
                Surname             = lastName,
                Email               = order.ShippingAddress.Email,
                IdentityNumber      = "11111111111",
                GsmNumber           = order.ShippingAddress.Phone,
                RegistrationDate    = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                LastLoginDate       = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RegistrationAddress = order.ShippingAddress.Line1,
                Ip                  = userIp ?? "127.0.0.1",
                City                = order.ShippingAddress.City,
                Country             = order.ShippingAddress.Country,
                ZipCode             = order.ShippingAddress.PostalCode ?? string.Empty,
            },
            ShippingAddress = new Iyzipay.Model.Address
            {
                ContactName = order.ShippingAddress.FullName,
                City        = order.ShippingAddress.City,
                Country     = order.ShippingAddress.Country,
                Description = order.ShippingAddress.Line1,
                ZipCode     = order.ShippingAddress.PostalCode ?? string.Empty,
            },
            BillingAddress = new Iyzipay.Model.Address
            {
                ContactName = order.BillingAddress.FullName,
                City        = order.BillingAddress.City,
                Country     = order.BillingAddress.Country,
                Description = order.BillingAddress.Line1,
                ZipCode     = order.BillingAddress.PostalCode ?? string.Empty,
            },
            BasketItems = order.Items.Select(item => new BasketItem
            {
                Id        = item.ProductId.ToString(),
                Name      = item.ProductName,
                Category1 = "Genel",
                ItemType  = BasketItemType.PHYSICAL.ToString(),
                Price     = item.TotalPrice.ToString("0.00", CultureInfo.InvariantCulture),
            }).ToList(),
        };

        CheckoutFormInitialize result;
        try
        {
            result = await Task.Run(() => CheckoutFormInitialize.Create(request, options));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İyzico SDK bağlantı hatası: OrderId={OrderId}", orderId);
            throw new InvalidOperationException("Ödeme servisiyle bağlantı kurulamadı. Lütfen tekrar deneyin.");
        }

        if (result.Status != "success")
        {
            _logger.LogError("İyzico ödeme başlatma hatası: {Code} - {Message}", result.ErrorCode, result.ErrorMessage);
            throw new InvalidOperationException(result.ErrorMessage ?? "Ödeme başlatılamadı.");
        }

        _context.PaymentTransactions.Add(new PaymentTransaction
        {
            OrderId  = orderId,
            Token    = result.Token,
            Status   = "pending",
            Amount   = order.TotalAmount,
            Currency = order.Currency,
        });
        await _context.SaveChangesAsync();

        _logger.LogInformation("Ödeme başlatıldı: OrderId={OrderId} Token={Token}", orderId, result.Token);

        return new InitiateResult(result.PaymentPageUrl, result.Token);
    }

    public async Task<CallbackResult> ProcessCallbackAsync(string token)
    {
        var tx = await _context.PaymentTransactions
            .FirstOrDefaultAsync(t => t.Token == token);

        if (tx is null)
        {
            _logger.LogError("Ödeme kaydı bulunamadı: Token={Token}", token);
            return new CallbackResult(false, Guid.Empty, "İşlem bulunamadı.");
        }

        var s = _settings.Value;

        if (s.MockPayment)
        {
            tx.Status      = "success";
            tx.CompletedAt = DateTime.UtcNow;
            try
            {
                await _orderService.UpdateStatusAsync(tx.OrderId, new UpdateOrderStatusRequest { Status = OrderStatus.Confirmed });
                _logger.LogInformation("[MOCK] Sipariş onaylandı: OrderId={OrderId}", tx.OrderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[MOCK] Sipariş onaylanamadı: OrderId={OrderId}", tx.OrderId);
            }
            await _context.SaveChangesAsync();
            return new CallbackResult(true, tx.OrderId, null);
        }

        var options = BuildOptions(s);

        var retrieveRequest = new RetrieveCheckoutFormRequest
        {
            Locale         = Locale.TR.ToString(),
            ConversationId = tx.OrderId.ToString(),
            Token          = token,
        };

        var result = await Task.Run(() => CheckoutForm.Retrieve(retrieveRequest, options));

        tx.CompletedAt = DateTime.UtcNow;

        if (result.PaymentStatus == "SUCCESS")
        {
            tx.Status         = "success";
            tx.IyzicoPaymentId = result.PaymentId;

            try
            {
                await _orderService.UpdateStatusAsync(tx.OrderId, new UpdateOrderStatusRequest
                {
                    Status = OrderStatus.Confirmed,
                });
                _logger.LogInformation("Sipariş onaylandı: OrderId={OrderId}", tx.OrderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sipariş onaylanamadı: OrderId={OrderId}", tx.OrderId);
            }
        }
        else
        {
            tx.Status       = "failure";
            tx.ErrorCode    = result.ErrorCode;
            tx.ErrorMessage = result.ErrorMessage;
            _logger.LogWarning("Ödeme başarısız: OrderId={OrderId} Code={Code} Message={Message}",
                tx.OrderId, result.ErrorCode, result.ErrorMessage);
        }

        await _context.SaveChangesAsync();

        return new CallbackResult(result.PaymentStatus == "SUCCESS", tx.OrderId, result.ErrorMessage);
    }

    private static IyzicoOptions BuildOptions(IyzicoSettings s) => new()
    {
        ApiKey    = s.ApiKey,
        SecretKey = s.SecretKey,
        BaseUrl   = s.BaseUrl,
    };
}
