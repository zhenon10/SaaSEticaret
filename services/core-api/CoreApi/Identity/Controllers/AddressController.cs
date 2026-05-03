using System.Security.Claims;
using CoreApi.Application.Tenancy;
using CoreApi.Identity.DTOs;
using CoreApi.Identity.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Identity.Controllers;

[ApiController]
[Route("addresses")]
[Authorize]
public class AddressController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantContext _tenantContext;

    public AddressController(ApplicationDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    private (Guid userId, Guid tenantId)? GetClaims()
    {
        var userIdStr   = User.FindFirstValue("sub");
        var tenantIdStr = User.FindFirstValue("tid");
        if (!Guid.TryParse(userIdStr, out var userId) || !Guid.TryParse(tenantIdStr, out var tenantId))
            return null;
        if (!_tenantContext.IsSet || _tenantContext.TenantId != tenantId)
            return null;
        return (userId, tenantId);
    }

    /// <summary>GET /addresses</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var claims = GetClaims();
        if (claims is null) return Forbid();
        var (userId, tenantId) = claims.Value;

        var addresses = await _context.UserAddresses
            .Where(a => a.UserId == userId && a.TenantId == tenantId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.CreatedAt)
            .Select(a => ToResponse(a))
            .ToListAsync();

        return Ok(addresses);
    }

    /// <summary>POST /addresses</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AddressRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var claims = GetClaims();
        if (claims is null) return Forbid();
        var (userId, tenantId) = claims.Value;

        if (request.IsDefault)
            await ClearDefault(userId, tenantId);

        var address = new UserAddress
        {
            Id         = Guid.NewGuid(),
            TenantId   = tenantId,
            UserId     = userId,
            Label      = request.Label,
            FullName   = request.FullName,
            Phone      = request.Phone,
            Line1      = request.Line1,
            Line2      = request.Line2,
            City       = request.City,
            District   = request.District,
            PostalCode = request.PostalCode,
            Country    = request.Country,
            IsDefault  = request.IsDefault,
            CreatedAt  = DateTime.UtcNow,
        };

        // İlk adres otomatik varsayılan
        var hasAny = await _context.UserAddresses.AnyAsync(a => a.UserId == userId && a.TenantId == tenantId);
        if (!hasAny) address.IsDefault = true;

        _context.UserAddresses.Add(address);
        await _context.SaveChangesAsync();

        return Ok(ToResponse(address));
    }

    /// <summary>PUT /addresses/{id}</summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AddressRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var claims = GetClaims();
        if (claims is null) return Forbid();
        var (userId, tenantId) = claims.Value;

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId && a.TenantId == tenantId);

        if (address is null) return NotFound();

        if (request.IsDefault)
            await ClearDefault(userId, tenantId);

        address.Label      = request.Label;
        address.FullName   = request.FullName;
        address.Phone      = request.Phone;
        address.Line1      = request.Line1;
        address.Line2      = request.Line2;
        address.City       = request.City;
        address.District   = request.District;
        address.PostalCode = request.PostalCode;
        address.Country    = request.Country;
        address.IsDefault  = request.IsDefault;

        await _context.SaveChangesAsync();
        return Ok(ToResponse(address));
    }

    /// <summary>DELETE /addresses/{id}</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var claims = GetClaims();
        if (claims is null) return Forbid();
        var (userId, tenantId) = claims.Value;

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId && a.TenantId == tenantId);

        if (address is null) return NotFound();

        _context.UserAddresses.Remove(address);
        await _context.SaveChangesAsync();

        // Silinen varsayılansa başkasını varsayılan yap
        if (address.IsDefault)
        {
            var next = await _context.UserAddresses
                .Where(a => a.UserId == userId && a.TenantId == tenantId)
                .OrderBy(a => a.CreatedAt)
                .FirstOrDefaultAsync();
            if (next is not null)
            {
                next.IsDefault = true;
                await _context.SaveChangesAsync();
            }
        }

        return NoContent();
    }

    /// <summary>PUT /addresses/{id}/default</summary>
    [HttpPut("{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id)
    {
        var claims = GetClaims();
        if (claims is null) return Forbid();
        var (userId, tenantId) = claims.Value;

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId && a.TenantId == tenantId);

        if (address is null) return NotFound();

        await ClearDefault(userId, tenantId);
        address.IsDefault = true;
        await _context.SaveChangesAsync();

        return Ok(ToResponse(address));
    }

    private async Task ClearDefault(Guid userId, Guid tenantId)
    {
        var defaults = await _context.UserAddresses
            .Where(a => a.UserId == userId && a.TenantId == tenantId && a.IsDefault)
            .ToListAsync();
        foreach (var a in defaults) a.IsDefault = false;
    }

    private static AddressResponse ToResponse(UserAddress a) => new()
    {
        Id         = a.Id,
        Label      = a.Label,
        FullName   = a.FullName,
        Phone      = a.Phone,
        Line1      = a.Line1,
        Line2      = a.Line2,
        City       = a.City,
        District   = a.District,
        PostalCode = a.PostalCode,
        Country    = a.Country,
        IsDefault  = a.IsDefault,
    };
}
