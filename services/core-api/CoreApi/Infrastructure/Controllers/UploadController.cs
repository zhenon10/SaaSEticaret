using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Infrastructure.Controllers;

[ApiController]
[Route("upload")]
public class UploadController : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;

    public UploadController(IWebHostEnvironment env, IConfiguration config)
    {
        _env = env;
        _config = config;
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "Dosya seçilmedi." });

        if (file.Length > MaxFileSize)
            return BadRequest(new { error = "Dosya 5 MB'dan büyük olamaz." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return BadRequest(new { error = "Sadece JPG, PNG, WebP ve GIF desteklenir." });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = System.IO.File.Create(filePath);
        await file.CopyToAsync(stream);

        var baseUrl = _config["APP_BASE_URL"]?.TrimEnd('/') ?? $"{Request.Scheme}://{Request.Host}";
        var url = $"{baseUrl}/uploads/{fileName}";
        return Ok(new { url });
    }
}
