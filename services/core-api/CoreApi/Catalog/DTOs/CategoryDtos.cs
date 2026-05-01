using System.ComponentModel.DataAnnotations;

namespace CoreApi.Catalog.DTOs;

public class CreateCategoryRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug must be lowercase letters, digits, and hyphens only.")]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? ParentId { get; set; }

    [Range(0, int.MaxValue)]
    public int DisplayOrder { get; set; }
}

public class UpdateCategoryRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(200)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$",
        ErrorMessage = "Slug must be lowercase letters, digits, and hyphens only.")]
    public string? Slug { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public Guid? ParentId { get; set; }
    public int?  DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}

public class CategoryResponse
{
    public Guid    Id           { get; set; }
    public string  Name         { get; set; } = string.Empty;
    public string  Slug         { get; set; } = string.Empty;
    public string? Description  { get; set; }
    public Guid?   ParentId     { get; set; }
    public string? ParentName   { get; set; }
    public int     DisplayOrder { get; set; }
    public bool    IsActive     { get; set; }
    public DateTime CreatedAt   { get; set; }

    public List<CategoryResponse> Children { get; set; } = new();
}

public class CategoryListResponse
{
    public Guid    Id           { get; set; }
    public string  Name         { get; set; } = string.Empty;
    public string  Slug         { get; set; } = string.Empty;
    public Guid?   ParentId     { get; set; }
    public int     DisplayOrder { get; set; }
    public bool    IsActive     { get; set; }
    public int     ProductCount { get; set; }
}
