namespace CoreApi.Payments.Entities;

public class PaymentTransaction
{
    public Guid      Id               { get; set; } = Guid.NewGuid();
    public Guid      OrderId          { get; set; }
    public string    Token            { get; set; } = string.Empty;
    public string    Status           { get; set; } = "pending"; // pending | success | failure
    public string    Method           { get; set; } = "iyzico";  // iyzico | bank_transfer
    public string?   IyzicoPaymentId  { get; set; }
    public string?   ErrorCode        { get; set; }
    public string?   ErrorMessage     { get; set; }
    public decimal   Amount           { get; set; }
    public string    Currency         { get; set; } = "TRY";
    public DateTime  CreatedAt        { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt      { get; set; }
}
