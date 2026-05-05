namespace CoreApi.Payments.Settings;

public class IyzicoSettings
{
    public string ApiKey      { get; set; } = string.Empty;
    public string SecretKey   { get; set; } = string.Empty;
    public string BaseUrl     { get; set; } = "https://sandbox.iyzipay.com";
    public string CallbackUrl { get; set; } = "http://localhost:5052/payments/callback";
    public string FrontendUrl  { get; set; } = "http://localhost:3000";
    public bool   MockPayment  { get; set; } = false;
}
