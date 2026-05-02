using CoreApi.Application.Tenancy;
using CoreApi.Domain.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Infrastructure.Controllers;

[ApiController]
[Route("site-settings")]
public class SiteSettingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ITenantContext _tenantContext;

    public SiteSettingsController(ApplicationDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    /// <summary>GET /site-settings — public, returns all settings as key-value map</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Dictionary<string, string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var settings = await _db.SiteSettings
            .Where(s => s.TenantId == _tenantContext.TenantId)
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return Ok(settings);
    }

    /// <summary>PUT /site-settings — Admin only, upserts all provided keys</summary>
    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(Dictionary<string, string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update([FromBody] Dictionary<string, string> incoming)
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var tenantId = _tenantContext.TenantId;
        var now = DateTime.UtcNow;

        var existing = await _db.SiteSettings
            .Where(s => s.TenantId == tenantId)
            .ToDictionaryAsync(s => s.Key);

        foreach (var (key, value) in incoming)
        {
            if (existing.TryGetValue(key, out var row))
            {
                row.Value = value;
                row.UpdatedAt = now;
            }
            else
            {
                _db.SiteSettings.Add(new SiteSetting
                {
                    TenantId  = tenantId,
                    Key       = key,
                    Value     = value,
                    UpdatedAt = now,
                });
            }
        }

        await _db.SaveChangesAsync();

        var result = await _db.SiteSettings
            .Where(s => s.TenantId == tenantId)
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return Ok(result);
    }
}
