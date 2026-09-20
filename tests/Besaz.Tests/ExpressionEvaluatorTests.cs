using Besaz.Api.Shared;
using FluentAssertions;
using Xunit;

namespace Besaz.Tests;

public class ExpressionEvaluatorTests
{
    [Theory]
    [InlineData("ceil(10000 / 3000)", 4)]
    [InlineData("1", 1)]
    [InlineData("ledCount", 3)]
    [InlineData("2 + 3 * 4", 14)]
    [InlineData("(2 + 3) * 4", 20)]
    [InlineData("10 % 3", 1)]
    [InlineData("round(3.6)", 4)]
    [InlineData("min(5, 12)", 5)]
    [InlineData("max(5, 12)", 12)]
    public void Numeric_formulas_evaluate_correctly(string expression, double expected)
    {
        var vars = new Dictionary<string, object?> { ["capacityMah"] = 10000L, ["ledCount"] = 3L };
        ExpressionEvaluator.EvaluateNumber(expression, vars).Should().BeApproximately(expected, 0.001);
    }

    [Fact]
    public void Ternary_boolean_formula_selects_branch()
    {
        var vars = new Dictionary<string, object?> { ["includeSwitch"] = true };
        ExpressionEvaluator.EvaluateNumber("includeSwitch == true ? 1 : 0", vars).Should().Be(1);
        vars["includeSwitch"] = false;
        ExpressionEvaluator.EvaluateNumber("includeSwitch ? 1 : 0", vars).Should().Be(0);
    }

    [Fact]
    public void Enum_equality_with_logical_or_works()
    {
        var vars = new Dictionary<string, object?> { ["outputSpec"] = "USB-C PD 18W" };
        ExpressionEvaluator.EvaluateNumber(
            "outputSpec == 'USB-C PD 18W' || outputSpec == 'USB-C PD 65W' ? 1 : 0", vars).Should().Be(1);
        vars["outputSpec"] = "USB-A 5V/2A";
        ExpressionEvaluator.EvaluateNumber(
            "outputSpec == 'USB-C PD 18W' || outputSpec == 'USB-C PD 65W' ? 1 : 0", vars).Should().Be(0);
    }

    [Fact]
    public void Comparison_operators_work()
    {
        var vars = new Dictionary<string, object?> { ["x"] = 7L };
        ExpressionEvaluator.EvaluateNumber("x >= 5 ? 2 : 1", vars).Should().Be(2);
        ExpressionEvaluator.EvaluateNumber("x > 10 ? 2 : 1", vars).Should().Be(1);
    }

    [Fact]
    public void Unknown_variable_throws()
    {
        var act = () => ExpressionEvaluator.EvaluateNumber("nope + 1", new Dictionary<string, object?>());
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Malformed_expression_throws()
    {
        var act = () => ExpressionEvaluator.EvaluateNumber("1 +", new Dictionary<string, object?>());
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void String_concatenation_supports_plus()
    {
        var value = ExpressionEvaluator.Evaluate("'USB-C ' + 'PD'", new Dictionary<string, object?>());
        value.Should().Be("USB-C PD");
    }
}