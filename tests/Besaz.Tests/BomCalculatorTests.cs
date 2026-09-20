using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Shared;
using FluentAssertions;
using Xunit;

namespace Besaz.Tests;

public class BomCalculatorTests
{
    private static RecipePayload Payload() => new(
        Title: "چراغ LED USB",
        Category: "lighting",
        Difficulty: Difficulty.Beginner,
        SafetyLevel: SafetyLevel.Low,
        EstimatedMinutes: 30,
        Skills: new[] { "پایه" },
        Summary: "چراغ",
        Parameters: new[]
        {
            new RecipeParameter("ledCount", "تعداد LED", "integer", 1, 4, 1, 1L),
            new RecipeParameter("ledColor", "رنگ", "enum", Options: new[]
            {
                new RecipeParameterOption("white", "سفید"),
                new RecipeParameterOption("red", "قرمز"),
            }, Default: "white"),
        },
        Components: new[]
        {
            new RecipeComponentRef("LED-5MM-WHITE", "Required", "ledCount", new[] { "LED-5MM-RED" }),
            new RecipeComponentRef("RES-470", "Required", "ledCount"),
        },
        Tools: new[] { "هویه" },
        Steps: new[] { new RecipeStep(1, "اتصال") },
        SafetyWarnings: new[] { "نکتهٔ ایمنی" },
        License: "CC-BY-NC-4.0");

    private static Dictionary<string, LogicalPart> Parts() => new()
    {
        ["LED-5MM-WHITE"] = new LogicalPart { Id = "LED-5MM-WHITE", NameFa = "LED سفید", Category = "led", Unit = "عدد" },
        ["LED-5MM-RED"] = new LogicalPart { Id = "LED-5MM-RED", NameFa = "LED قرمز", Category = "led", Unit = "عدد" },
        ["RES-470"] = new LogicalPart { Id = "RES-470", NameFa = "مقاومت ۴۷۰", Category = "resistor", Unit = "عدد" },
    };

    private static Dictionary<string, IReadOnlyList<SupplierProduct>> Products() => new()
    {
        ["LED-5MM-WHITE"] = new List<SupplierProduct>
        {
            Product("LED-5MM-WHITE", 900, StockStatus.InStock, "فروشگاه B"),
            Product("LED-5MM-WHITE", 800, StockStatus.InStock, "فروشگاه A"),
        },
        ["RES-470"] = new List<SupplierProduct>
        {
            Product("RES-470", 250, StockStatus.InStock, "فروشگاه A"),
        },
    };

    private static SupplierProduct Product(string part, decimal price, StockStatus stock, string supplier)
    {
        var s = new Supplier { Id = Guid.NewGuid(), Name = supplier };
        return new SupplierProduct
        {
            Id = 1, SupplierId = s.Id, LogicalPartId = part, Sku = part, Title = part,
            Price = price, StockStatus = stock, LastSyncAt = DateTimeOffset.UtcNow,
            Supplier = s,
        };
    }

    private static readonly BomRuleDefinition[] Rules =
    {
        new() { Code = "BOM-001", Severity = RuleSeverity.Error, IsActive = true },
        new() { Code = "BOM-002", Severity = RuleSeverity.Warning, IsActive = true },
        new() { Code = "BOM-003", Severity = RuleSeverity.Error, IsActive = true },
    };

    [Fact]
    public void Computes_qty_from_parameter_and_picks_cheapest_instock()
    {
        var raw = new Dictionary<string, object?> { ["ledCount"] = 3L };
        var result = BomCalculator.Compute(Payload(), raw, Parts(), Products(), Rules);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();

        var led = result.Lines.Single(l => l.LogicalPartId == "LED-5MM-WHITE");
        led.Quantity.Should().Be(3);
        led.UnitPrice.Should().Be(800); // ارزان‌ترین InStock
        led.LineTotal.Should().Be(2400);

        var res = result.Lines.Single(l => l.LogicalPartId == "RES-470");
        res.Quantity.Should().Be(3);
    }

    [Fact]
    public void Default_parameter_used_when_not_supplied()
    {
        var result = BomCalculator.Compute(Payload(), new Dictionary<string, object?>(), Parts(), Products(), Rules);
        var led = result.Lines.Single(l => l.LogicalPartId == "LED-5MM-WHITE");
        led.Quantity.Should().Be(1);
    }

    [Fact]
    public void Missing_required_part_makes_bom_invalid()
    {
        var parts = Parts();
        parts.Remove("RES-470");
        var result = BomCalculator.Compute(Payload(), new Dictionary<string, object?>(), parts, Products(), Rules);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("RES-470", StringComparison.Ordinal));
    }

    [Fact]
    public void Missing_part_without_supplier_is_warning_not_error_for_optional()
    {
        var payload = Payload() with
        {
            Components = new[]
            {
                new RecipeComponentRef("LED-5MM-WHITE", "Required", "1"),
                new RecipeComponentRef("GHOST-PART", "Optional", "1"),
            },
        };
        var parts = Parts();
        var products = Products();
        var result = BomCalculator.Compute(payload, new Dictionary<string, object?>(), parts, products, Rules);
        result.IsValid.Should().BeTrue();
        result.Warnings.Should().Contain(w => w.Contains("تأمین‌کننده", StringComparison.Ordinal));
    }

    [Fact]
    public void OutOfStock_item_raises_warning_via_rule()
    {
        var products = Products();
        products["RES-470"] = new List<SupplierProduct>
        {
            Product("RES-470", 200, StockStatus.OutOfStock, "فروشگاه A"),
        };
        var result = BomCalculator.Compute(Payload(), new Dictionary<string, object?>(), Parts(), products, Rules);
        result.Warnings.Should().Contain(w => w.Contains("ناموجود", StringComparison.Ordinal));
    }
}