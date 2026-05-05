namespace CoreApi.Payments.Services;

public record InitiateResult(string PaymentPageUrl, string Token);
public record CallbackResult(bool Success, Guid OrderId, string? ErrorMessage);

public interface IPaymentService
{
    Task<InitiateResult> InitiateAsync(Guid orderId, Guid? userId, string? userIp);
    Task<CallbackResult> ProcessCallbackAsync(string token);
}
