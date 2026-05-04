using System.Security.Claims;
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

    public AddressController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirstValue("sub");
        return Guid.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId is null) return Forbid();

        var addresses = await _context.UserAddresses
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenBy(a => a.CreatedAt)
            .Select(a => ToResponse(a))
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AddressRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        if (userId is null) return Forbid();

        if (request.IsDefault)
            await ClearDefault(userId.Value);

        var address = new UserAddress
        {
            Id         = Guid.NewGuid(),
            UserId     = userId.Value,
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

        var hasAny = await _context.UserAddresses.AnyAsync(a => a.UserId == userId);
        if (!hasAny) address.IsDefault = true;

        _context.UserAddresses.Add(address);
        await _context.SaveChangesAsync();

        return Ok(ToResponse(address));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AddressRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        if (userId is null) return Forbid();

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address is null) return NotFound();

        if (request.IsDefault)
            await ClearDefault(userId.Value);

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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId is null) return Forbid();

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address is null) return NotFound();

        _context.UserAddresses.Remove(address);
        await _context.SaveChangesAsync();

        if (address.IsDefault)
        {
            var next = await _context.UserAddresses
                .Where(a => a.UserId == userId)
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

    [HttpPut("{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id)
    {
        var userId = GetUserId();
        if (userId is null) return Forbid();

        var address = await _context.UserAddresses
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

        if (address is null) return NotFound();

        await ClearDefault(userId.Value);
        address.IsDefault = true;
        await _context.SaveChangesAsync();

        return Ok(ToResponse(address));
    }

    private async Task ClearDefault(Guid userId)
    {
        var defaults = await _context.UserAddresses
            .Where(a => a.UserId == userId && a.IsDefault)
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
