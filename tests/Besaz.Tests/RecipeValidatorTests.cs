using Besaz.Api.Modules.Recipes;
using Besaz.Api.Shared;
using FluentAssertions;
using Xunit;

namespace Besaz.Tests;

public class RecipeValidatorTests
{
    private static RecipePayload Valid() => new(
        Title: "چراغ LED USB",
        Category: "lighting",
        Difficulty: Difficulty.Beginner,
        SafetyLevel: SafetyLevel.Low,
        EstimatedMinutes: 30,
        Skills: new[] { "لحیم‌کاری پایه" },
        Summary: "چراغ ساده",
        Parameters: new[]
        {
            new RecipeParameter("ledCount", "تعداد LED", "integer", 1, 4, 1, 1L),
        },
        Components: new[]
        {
            new RecipeComponentRef("LED-5MM-WHITE", "Required", "1"),
            new RecipeComponentRef("RES-470", "Required", "ledCount"),
        },
        Tools: new[] { "هویه" },
        Steps: new[] { new RecipeStep(1, "اتصال") },
        SafetyWarnings: new[] { "نکتهٔ ایمنی" },
        License: "CC-BY-NC-4.0");

    [Fact]
    public void Valid_payload_has_no_errors()
    {
        RecipeValidator.Validate(Valid()).Should().BeEmpty();
    }

    [Fact]
    public void Missing_title_is_rejected()
    {
        var errors = RecipeValidator.Validate(Valid() with { Title = "ab" });
        errors.Should().Contain(e => e.Contains("عنوان", StringComparison.Ordinal));
    }

    [Fact]
    public void Empty_components_are_rejected()
    {
        var errors = RecipeValidator.Validate(Valid() with { Components = Array.Empty<RecipeComponentRef>() });
        errors.Should().Contain(e => e.Contains("قطعه", StringComparison.Ordinal));
    }

    [Fact]
    public void High_safety_requires_warnings()
    {
        var errors = RecipeValidator.Validate(Valid() with
        {
            SafetyLevel = SafetyLevel.High,
            SafetyWarnings = Array.Empty<string>(),
        });
        errors.Should().Contain(e => e.Contains("هشدار ایمنی", StringComparison.Ordinal));
    }

    [Fact]
    public void Duplicate_parameter_keys_rejected()
    {
        var errors = RecipeValidator.Validate(Valid() with
        {
            Parameters = new[]
            {
                new RecipeParameter("capacityMah", "ظرفیت", "integer", 1000, 30000, 1000, 10000L),
                new RecipeParameter("capacityMah", "تکراری", "integer", 1000, 30000, 1000, 10000L),
            },
        });
        errors.Should().Contain(e => e.Contains("تکراری", StringComparison.Ordinal));
    }

    [Fact]
    public void Enum_without_options_rejected()
    {
        var errors = RecipeValidator.Validate(Valid() with
        {
            Parameters = new[] { new RecipeParameter("color", "رنگ", "enum") },
        });
        errors.Should().Contain(e => e.Contains("گزینه", StringComparison.Ordinal));
    }

    [Fact]
    public void Invalid_qty_formula_rejected()
    {
        var errors = RecipeValidator.Validate(Valid() with
        {
            Components = new[]
            {
                Valid().ComponentsList[0] with { QtyFormula = "ceil(" },
            },
        });
        errors.Should().Contain(e => e.Contains("فرمول", StringComparison.Ordinal));
    }
}