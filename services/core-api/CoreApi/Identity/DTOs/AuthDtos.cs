using System.ComponentModel.DataAnnotations;

namespace CoreApi.Identity.DTOs;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(Password), ErrorMessage = "Şifreler eşleşmiyor.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string    AccessToken  { get; set; } = string.Empty;
    public string    RefreshToken { get; set; } = string.Empty;
    public UserInfoDto User       { get; set; } = null!;
}

public class WebLoginResponse
{
    public UserInfoDto User { get; set; } = null!;
}

public class RefreshRequest
{
    // Optional: mobile clients supply the token in the body;
    // web clients supply it via the HttpOnly cookie (ad_rt / st_rt).
    public string? RefreshToken { get; set; }
}

public class RefreshResponse
{
    public string AccessToken  { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class UserInfoDto
{
    public Guid   Id    { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role  { get; set; } = string.Empty;
}

public class AuthResult
{
    public bool        Success      { get; set; }
    public string?     Error        { get; set; }
    public string?     AccessToken  { get; set; }
    public string?     RefreshToken { get; set; }
    public UserInfoDto? User        { get; set; }
}
