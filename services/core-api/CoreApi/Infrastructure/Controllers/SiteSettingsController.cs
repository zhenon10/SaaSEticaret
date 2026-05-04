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

    public SiteSettingsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var settings = await _db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value);
        return Ok(settings);
    }

    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update([FromBody] Dictionary<string, string> incoming)
    {
        var now      = DateTime.UtcNow;
        var existing = await _db.SiteSettings.ToDictionaryAsync(s => s.Key);

        foreach (var (key, value) in incoming)
        {
            if (existing.TryGetValue(key, out var row))
            {
                row.Value     = value;
                row.UpdatedAt = now;
            }
            else
            {
                _db.SiteSettings.Add(new SiteSetting
                {
                    Key       = key,
                    Value     = value,
                    UpdatedAt = now,
                });
            }
        }

        await _db.SaveChangesAsync();

        var result = await _db.SiteSettings.ToDictionaryAsync(s => s.Key, s => s.Value);
        return Ok(result);
    }
}
