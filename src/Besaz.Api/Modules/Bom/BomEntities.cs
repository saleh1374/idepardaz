using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Bom;

/// <summary>
/// BOM — سبد قطعات معتبر یک Project بر پایهٔ یک RecipeVersion قفل‌شده.
/// قانون سند: BOM نامعتبر ساخته نمی‌شود؛ قیمت‌ها همیشه snapshot هستند.
/// </summary>
public class Bom
{
    public long Id { get; set; }
    public string RecipeId { get; set; } = "";
    public long RecipeVersionId { get; set; }
    public string RecipeVersionText { get; set; } = "";
    public long? ProjectId { get; set; }
    public string ParametersJson { get; set; } = "{}";  // jsonb
    public string ValidationMessagesJson { get; set; } = "[]"; // jsonb — آرایهٔ پیام
    public bool IsValid { get; set; }
    public decimal? Total { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<BomItem> Items { get; set; } = new List<BomItem>();
}

/// <summary>قلم BOM با قیمت/موجودی snapshot لحظهٔ ساخت.</summary>
public class BomItem
{
    public long Id { get; set; }
    public long BomId { get; set; }
    public BomItemRole Role { get; set; }
    public string LogicalPartId { get; set; } = "";
    public string LogicalPartName { get; set; } = "";
    public decimal Quantity { get; set; }
    public long? SupplierProductId { get; set; }
    public string? SupplierName { get; set; }
    public string? Sku { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? LineTotal { get; set; }
    public StockStatus? StockStatus { get; set; }
    public string? Url { get; set; }
    public string? Notes { get; set; }

    public Bom? Bom { get; set; }
}

/// <summary>
/// تعریف قانون سازگاری — «قانون‌ها دیتا هستند نه هاردکد» (بخش ۶ سند).
/// BOM‌محاسبه‌گر، قوانین فعال را از دیتابیس می‌خواند و با کد اجرا می‌کند.
/// </summary>
public class BomRuleDefinition
{
    public long Id { get; set; }
    public string Code { get; set; } = "";        // BOM-001
    public string NameFa { get; set; } = "";
    public string Description { get; set; } = "";
    public RuleSeverity Severity { get; set; }
    public bool IsActive { get; set; } = true;
}