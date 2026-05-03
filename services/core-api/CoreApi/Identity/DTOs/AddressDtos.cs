using System.ComponentModel.DataAnnotations;

namespace CoreApi.Identity.DTOs;

public class AddressRequest
{
    [Required]
    [MaxLength(100)]
    public string Label { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Line1 { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Line2 { get; set; }

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string District { get; set; } = string.Empty;

    [MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Country { get; set; } = "Türkiye";

    public bool IsDefault { get; set; }
}

public class AddressResponse
{
    public Guid    Id         { get; set; }
    public string  Label      { get; set; } = string.Empty;
    public string  FullName   { get; set; } = string.Empty;
    public string  Phone      { get; set; } = string.Empty;
    public string  Line1      { get; set; } = string.Empty;
    public string? Line2      { get; set; }
    public string  City       { get; set; } = string.Empty;
    public string  District   { get; set; } = string.Empty;
    public string  PostalCode { get; set; } = string.Empty;
    public string  Country    { get; set; } = string.Empty;
    public bool    IsDefault  { get; set; }
}
