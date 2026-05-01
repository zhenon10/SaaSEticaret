using CoreApi.Application.Tenancy;
using CoreApi.Catalog.DTOs;
using CoreApi.Catalog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Catalog.Controllers;

[ApiController]
[Route("catalog/categories")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<CategoryController> _logger;

    public CategoryController(
        ICategoryService categoryService,
        ITenantContext tenantContext,
        ILogger<CategoryController> logger)
    {
        _categoryService = categoryService;
        _tenantContext   = tenantContext;
        _logger          = logger;
    }

    /// <summary>GET /catalog/categories — flat list with product counts</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<CategoryListResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAll()
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var categories = await _categoryService.GetAllAsync();
        return Ok(categories);
    }

    /// <summary>GET /catalog/categories/tree — hierarchical tree</summary>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(List<CategoryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTree()
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var tree = await _categoryService.GetTreeAsync();
        return Ok(tree);
    }

    /// <summary>GET /catalog/categories/{id}</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var category = await _categoryService.GetByIdAsync(id);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>GET /catalog/categories/slug/{slug}</summary>
    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        var category = await _categoryService.GetBySlugAsync(slug);
        return category is null ? NotFound() : Ok(category);
    }

    /// <summary>POST /catalog/categories — Admin or Staff only</summary>
    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        try
        {
            var category = await _categoryService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>PUT /catalog/categories/{id} — Admin or Staff only</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        try
        {
            var category = await _categoryService.UpdateAsync(id, request);
            return category is null ? NotFound() : Ok(category);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>DELETE /catalog/categories/{id} — Admin only</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id)
    {
        if (!_tenantContext.IsSet)
            return BadRequest(new { error = "Tenant context not found" });

        try
        {
            var deleted = await _categoryService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
