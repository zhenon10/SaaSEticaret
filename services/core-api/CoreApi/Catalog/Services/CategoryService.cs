using CoreApi.Catalog.DTOs;
using CoreApi.Catalog.Entities;
using CoreApi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CoreApi.Catalog.Services;

public interface ICategoryService
{
    Task<List<CategoryListResponse>> GetAllAsync();
    Task<List<CategoryResponse>>     GetTreeAsync();
    Task<CategoryResponse?>          GetByIdAsync(Guid id);
    Task<CategoryResponse?>          GetBySlugAsync(string slug);
    Task<CategoryResponse>           CreateAsync(CreateCategoryRequest request);
    Task<CategoryResponse?>          UpdateAsync(Guid id, UpdateCategoryRequest request);
    Task<bool>                       DeleteAsync(Guid id);
}

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(
        ApplicationDbContext context,
        ILogger<CategoryService> logger)
    {
        _context = context;
        _logger  = logger;
    }

    public async Task<List<CategoryListResponse>> GetAllAsync()
    {
        return await _context.Categories
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryListResponse
            {
                Id           = c.Id,
                Name         = c.Name,
                Slug         = c.Slug,
                ParentId     = c.ParentId,
                DisplayOrder = c.DisplayOrder,
                IsActive     = c.IsActive,
                ProductCount = c.Products.Count()
            })
            .ToListAsync();
    }

    public async Task<List<CategoryResponse>> GetTreeAsync()
    {
        var all = await _context.Categories
            .Include(c => c.Children)
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .ToListAsync();

        return all
            .Where(c => c.ParentId == null)
            .Select(c => MapToResponse(c, all))
            .ToList();
    }

    public async Task<CategoryResponse?> GetByIdAsync(Guid id)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .Include(c => c.Parent)
            .FirstOrDefaultAsync(c => c.Id == id);

        return category is null ? null : MapToResponse(category, null);
    }

    public async Task<CategoryResponse?> GetBySlugAsync(string slug)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .Include(c => c.Parent)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        return category is null ? null : MapToResponse(category, null);
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        if (await _context.Categories.AnyAsync(c => c.Slug == request.Slug))
            throw new InvalidOperationException($"A category with slug '{request.Slug}' already exists.");

        if (request.ParentId.HasValue)
        {
            var parentExists = await _context.Categories.AnyAsync(c => c.Id == request.ParentId);
            if (!parentExists)
                throw new InvalidOperationException("Parent category not found.");
        }

        var category = new Category
        {
            Id           = Guid.NewGuid(),
            Name         = request.Name,
            Slug         = request.Slug,
            Description  = request.Description,
            ParentId     = request.ParentId,
            DisplayOrder = request.DisplayOrder,
            IsActive     = true,
            CreatedAt    = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} '{Slug}' created", category.Id, category.Slug);

        return MapToResponse(category, null);
    }

    public async Task<CategoryResponse?> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return null;

        if (request.Slug is not null && request.Slug != category.Slug)
        {
            if (await _context.Categories.AnyAsync(c => c.Slug == request.Slug && c.Id != id))
                throw new InvalidOperationException($"A category with slug '{request.Slug}' already exists.");
            category.Slug = request.Slug;
        }

        if (request.ParentId.HasValue && request.ParentId != category.ParentId)
        {
            if (request.ParentId == id || await IsDescendantAsync(request.ParentId.Value, id))
                throw new InvalidOperationException("Cannot set a descendant as parent (circular reference).");

            var parentExists = await _context.Categories.AnyAsync(c => c.Id == request.ParentId);
            if (!parentExists)
                throw new InvalidOperationException("Parent category not found.");

            category.ParentId = request.ParentId;
        }
        else if (request.ParentId == Guid.Empty)
        {
            category.ParentId = null;
        }

        if (request.Name         is not null) category.Name         = request.Name;
        if (request.Description  is not null) category.Description  = request.Description;
        if (request.DisplayOrder is not null) category.DisplayOrder = request.DisplayOrder.Value;
        if (request.IsActive     is not null) category.IsActive     = request.IsActive.Value;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} updated", id);

        return MapToResponse(category, null);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var category = await _context.Categories
            .Include(c => c.Children)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return false;

        if (category.Children.Any())
            throw new InvalidOperationException("Cannot delete a category that has subcategories.");

        if (category.Products.Any())
            throw new InvalidOperationException("Cannot delete a category that has products.");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} deleted", id);
        return true;
    }

    private async Task<bool> IsDescendantAsync(Guid candidateId, Guid ancestorId)
    {
        var candidate = await _context.Categories.FirstOrDefaultAsync(c => c.Id == candidateId);

        while (candidate?.ParentId is not null)
        {
            if (candidate.ParentId == ancestorId)
                return true;
            candidate = await _context.Categories.FirstOrDefaultAsync(c => c.Id == candidate.ParentId);
        }
        return false;
    }

    private static CategoryResponse MapToResponse(Category c, List<Category>? all) => new()
    {
        Id           = c.Id,
        Name         = c.Name,
        Slug         = c.Slug,
        Description  = c.Description,
        ParentId     = c.ParentId,
        ParentName   = c.Parent?.Name,
        DisplayOrder = c.DisplayOrder,
        IsActive     = c.IsActive,
        CreatedAt    = c.CreatedAt,
        Children     = (all is not null
            ? all.Where(x => x.ParentId == c.Id).Select(x => MapToResponse(x, all))
            : c.Children.Select(x => MapToResponse(x, null)))
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .ToList()
    };
}
