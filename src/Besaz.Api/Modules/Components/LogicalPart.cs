using Besaz.Api.Modules.Suppliers;

namespace Besaz.Api.Modules.Components;

/// <summary>قطعهٔ منطقی (LogicalPart) — سطح انتزاع بین Recipe و فروشگاه. Recipe هرگز به URL فروشگاه وابسته نیست.</summary>
public class LogicalPart
{
    public string Id { get; set; } = "";          // مثال: CELL-18650
    public string NameFa { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string Category { get; set; } = "";    // battery / led / resistor / module ...
    public string? Description { get; set; }
    public string Unit { get; set; } = "";        // عدد / متر / عدد
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<ComponentSpecification> Specifications { get; set; } = new List<ComponentSpecification>();
    public ICollection<SupplierProduct> SupplierProducts { get; set; } = new List<SupplierProduct>();
}

/// <summary>مشخصهٔ فنی قطعه (ولتاژ، جریان، ابعاد، Package...) — ورودی Rule Engine سازگاری.</summary>
public class ComponentSpecification
{
    public long Id { get; set; }
    public string LogicalPartId { get; set; } = "";
    public string Key { get; set; } = "";         // voltage / maxCurrent / package / dimensionMm
    public string Value { get; set; } = "";
    public string? Unit { get; set; }
    public LogicalPart? LogicalPart { get; set; }
}