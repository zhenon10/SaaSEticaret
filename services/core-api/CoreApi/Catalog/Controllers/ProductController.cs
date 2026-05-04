using CoreApi.Catalog.DTOs;
using CoreApi.Catalog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CoreApi.Catalog.Controllers;

[ApiController]
[Route("catalog/products")]
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductController> _logger;

    public ProductController(IProductService productService, ILogger<ProductController> logger)
    {
        _productService = productService;
        _logger         = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductListItem>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetPaged([FromQuery] ProductQueryFilter filter)
    {
        var result = await _productService.GetPagedAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var product = await _productService.GetBySlugAsync(slug);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        try
        {
            var product = await _productService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(ProductResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        try
        {
            var product = await _productService.UpdateAsync(id, request);
            return product is null ? NotFound() : Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _productService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(ProductImageResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddImage(Guid id, [FromBody] AddProductImageRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        try
        {
            var image = await _productService.AddImageAsync(id, request);
            return StatusCode(StatusCodes.Status201Created, image);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveImage(Guid id, Guid imageId)
    {
        var removed = await _productService.RemoveImageAsync(id, imageId);
        return removed ? NoContent() : NotFound();
    }

    [HttpGet("{id:guid}/inventory")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(InventoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInventory(Guid id)
    {
        var inventory = await _productService.GetInventoryAsync(id);
        return inventory is null ? NotFound() : Ok(inventory);
    }

    [HttpPut("{id:guid}/inventory")]
    [Authorize(Policy = "StaffOrAbove")]
    [ProducesResponseType(typeof(InventoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateInventory(Guid id, [FromBody] UpdateInventoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Invalid request", details = ModelState });

        var inventory = await _productService.UpdateInventoryAsync(id, request);
        return inventory is null ? NotFound() : Ok(inventory);
    }
}
