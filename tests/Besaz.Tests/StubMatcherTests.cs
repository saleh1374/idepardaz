using Besaz.Api.Modules.Ai;
using FluentAssertions;
using Xunit;

namespace Besaz.Tests;

public class StubMatcherTests
{
    private static readonly IntentEngine.CatalogEntry[] Catalog =
    {
        new("RLED-001", "چراغ LED USB", "یک چراغ مطالعهٔ ساده با LED و کابل USB", "lighting چراغ led usb روشنایی"),
        new("PB-001", "پاوربانک USB-C", "پاوربانک با سلول 18650 و BMS", "power باتری پاوربانک شارژ"),
        new("FAN-001", "فن USB", "فن خنک‌کنندهٔ USB", "lighting فن usb خنک"),
    };

    [Fact]
    public void Returns_recommended_recipe_for_persian_request()
    {
        var result = StubMatcher.Recommend("می‌خواهم یک چراج LED USB بسازم", Catalog);
        result.RecommendedRecipeId.Should().Be("RLED-001");
        result.Intent.Should().Be("recipe_selected");
        result.Confidence.Should().BeGreaterThan(0.3);
    }

    [Fact]
    public void Battery_request_adds_safety_warning_and_still_matches()
    {
        var result = StubMatcher.Recommend("یک پاوربانک با باتری لیتیومی می‌خواهم", Catalog);
        result.RecommendedRecipeId.Should().Be("PB-001");
        result.Warnings.Should().Contain(w => w.Contains("باتری لیتیومی", StringComparison.Ordinal));
    }

    [Fact]
    public void Unrelated_request_returns_null_recipe()
    {
        var result = StubMatcher.Recommend("لطفاً یک برگهٔ اکسل برای من بساز", Catalog);
        result.RecommendedRecipeId.Should().BeNull();
        result.MissingRequirements.Should().NotBeEmpty();
    }
}