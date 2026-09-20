using System.Text.Json;
using System.Text.Json.Serialization;
using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Recipes;

/// <summary>
/// بدنهٔ استاندارد Recipe (مطابق docs/recipe.schema.json).
/// این مدل داخل RecipeVersion به‌صورت JSONB (غیرقابل تغییر) ذخیره می‌شود.
/// </summary>
public sealed record RecipePayload(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("category")] string Category,
    [property: JsonPropertyName("difficulty")] Difficulty Difficulty,
    [property: JsonPropertyName("safetyLevel")] SafetyLevel SafetyLevel,
    [property: JsonPropertyName("estimatedMinutes")] int EstimatedMinutes,
    [property: JsonPropertyName("skills")] IReadOnlyList<string>? Skills = null,
    [property: JsonPropertyName("summary")] string? Summary = null,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("parameters")] IReadOnlyList<RecipeParameter>? Parameters = null,
    [property: JsonPropertyName("components")] IReadOnlyList<RecipeComponentRef>? Components = null,
    [property: JsonPropertyName("tools")] IReadOnlyList<string>? Tools = null,
    [property: JsonPropertyName("steps")] IReadOnlyList<RecipeStep>? Steps = null,
    [property: JsonPropertyName("tests")] IReadOnlyList<RecipeTest>? Tests = null,
    [property: JsonPropertyName("safetyWarnings")] IReadOnlyList<string>? SafetyWarnings = null,
    [property: JsonPropertyName("license")] string? License = "CC-BY-NC-4.0",
    [property: JsonPropertyName("authorId")] string? AuthorId = null,
    [property: JsonPropertyName("reviewerIds")] IReadOnlyList<string>? ReviewerIds = null)
{
    public IReadOnlyList<string> SkillsList => Skills ?? Array.Empty<string>();
    public IReadOnlyList<RecipeParameter> ParametersList => Parameters ?? Array.Empty<RecipeParameter>();
    public IReadOnlyList<RecipeComponentRef> ComponentsList => Components ?? Array.Empty<RecipeComponentRef>();
    public IReadOnlyList<string> ToolsList => Tools ?? Array.Empty<string>();
    public IReadOnlyList<RecipeStep> StepsList => Steps ?? Array.Empty<RecipeStep>();
    public IReadOnlyList<RecipeTest> TestsList => Tests ?? Array.Empty<RecipeTest>();
    public IReadOnlyList<string> SafetyWarningsList => SafetyWarnings ?? Array.Empty<string>();
    public IReadOnlyList<string> ReviewerIdsList => ReviewerIds ?? Array.Empty<string>();
    public string LicenseValue => License ?? "CC-BY-NC-4.0";
}

public sealed record RecipeParameter(
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("type")] string Type = "integer",
    [property: JsonPropertyName("min")] int? Min = null,
    [property: JsonPropertyName("max")] int? Max = null,
    [property: JsonPropertyName("step")] int? Step = null,
    [property: JsonPropertyName("default")] object? Default = null,
    [property: JsonPropertyName("options")] IReadOnlyList<RecipeParameterOption>? Options = null,
    [property: JsonPropertyName("affects")] IReadOnlyList<ParameterAffect>? Affects = null)
{
    public IReadOnlyList<RecipeParameterOption> OptionsList => Options ?? Array.Empty<RecipeParameterOption>();
    public IReadOnlyList<ParameterAffect> AffectsList => Affects ?? Array.Empty<ParameterAffect>();

    /// <summary>تبدیل مقدار پیش‌فرض JSON (JsonElement) به نوع .NET ساده.</summary>
    public object? GetDefaultValue()
    {
        if (Default is null) return null;
        if (Default is JsonElement e)
        {
            return e.ValueKind switch
            {
                JsonValueKind.Number => e.TryGetInt64(out var l) ? l : e.GetDouble(),
                JsonValueKind.String => e.GetString(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => null,
            };
        }
        return Default;
    }
}

public sealed record RecipeParameterOption(
    [property: JsonPropertyName("value")] string Value,
    [property: JsonPropertyName("label")] string Label);

public sealed record ParameterAffect(
    [property: JsonPropertyName("logicalPartId")] string LogicalPartId,
    [property: JsonPropertyName("expression")] string Expression);

public sealed record RecipeComponentRef(
    [property: JsonPropertyName("logicalPartId")] string LogicalPartId,
    [property: JsonPropertyName("role")] string Role = "Required",
    [property: JsonPropertyName("qtyFormula")] string? QtyFormula = null,
    [property: JsonPropertyName("alternatives")] IReadOnlyList<string>? Alternatives = null,
    [property: JsonPropertyName("notes")] string? Notes = null)
{
    public IReadOnlyList<string> AlternativesList => Alternatives ?? Array.Empty<string>();
}

public sealed record RecipeStep(
    [property: JsonPropertyName("n")] int N,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("safety")] string? Safety = null);

public sealed record RecipeTest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("expected")] string Expected,
    [property: JsonPropertyName("tolerance")] string? Tolerance = null);