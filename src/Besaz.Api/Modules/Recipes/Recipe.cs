using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Recipes;

/// <summary>سرشاخهٔ Recipe — وضعیت فعلی و سرعت دسترسی به نسخهٔ جاری.</summary>
public class Recipe
{
    public string Id { get; set; } = "";          // مثال: RLED-001
    public string Slug { get; set; } = "";        // برای SEO و URL
    public string Title { get; set; } = "";
    public string Category { get; set; } = "";
    public Difficulty Difficulty { get; set; }
    public SafetyLevel SafetyLevel { get; set; }
    public int EstimatedMinutes { get; set; }
    public RecipeStatus Status { get; set; }
    public string? CurrentVersion { get; set; }   // مثال: 1.2.0
    public string? Summary { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<RecipeVersion> Versions { get; set; } = new List<RecipeVersion>();
}

/// <summary>
/// نسخهٔ غیرقابل تغییر (Immutable) Recipe — قانون ۱ و ۲ سند.
/// هر تغییر = نسخهٔ جدید + changelog. Projectها به یک نسخه دقیق lock می‌شوند.
/// </summary>
public class RecipeVersion
{
    public long Id { get; set; }
    public string RecipeId { get; set; } = "";
    public string Version { get; set; } = "";     // Semantic: 1.2.0
    public RecipeStatus Status { get; set; }
    public string PayloadJson { get; set; } = "{}";    // jsonb — بدنهٔ کامل RecipePayload
    public string ChangelogJson { get; set; } = "[]";  // jsonb — آرایهٔ رشته
    public DateTimeOffset CreatedAt { get; set; }

    public Recipe? Recipe { get; set; }
}