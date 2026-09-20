using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Bom;

/// <summary>
/// محاسبهٔ خالص BOM — بدون وابستگی به دیتابیس؛ قابل تست واحد.
/// ورودی: payload نسخهٔ قفل‌شده + پارامترهای کاربر + کاتالوگ قطعات/محصولات + قوانین.
/// خروجی: BomComputation (معتبر بودن، خطاها، هشدارها، قلم‌ها و جمع کل).
/// </summary>
public static class BomCalculator
{
    public sealed record BomLine(
        string LogicalPartId,
        string PartName,
        BomItemRole Role,
        decimal Quantity,
        long? SupplierProductId,
        string? SupplierName,
        string? Sku,
        decimal? UnitPrice,
        decimal? LineTotal,
        StockStatus? StockStatus,
        string? Url,
        string? Notes);

    public sealed record BomComputation(
        bool IsValid,
        IReadOnlyList<string> Errors,
        IReadOnlyList<string> Warnings,
        IReadOnlyList<BomLine> Lines,
        decimal? Total);

    public static BomComputation Compute(
        RecipePayload payload,
        IReadOnlyDictionary<string, object?> rawParameters,
        IReadOnlyDictionary<string, LogicalPart> parts,
        IReadOnlyDictionary<string, IReadOnlyList<SupplierProduct>> productsByPart,
        IReadOnlyList<BomRuleDefinition> rules)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        // ۱) اعتبارسنجی ساختاری (مشروعیت نسخه باید قبل از ذخیره ارزیابی شده باشد؛ اینجا دفاع دو)
        var structural = RecipeValidator.Validate(payload);
        if (structural.Count > 0)
            return new BomComputation(false, structural.ToList(), warnings, Array.Empty<BomLine>(), null);

        // ۲) پارامترهای مؤثر (پیش‌فرض + اعمال min/max + گزینه‌های enum)
        var effective = ResolveParameters(payload, rawParameters, errors);
        var variables = effective.ToDictionary(kv => kv.Key, kv => (object?)kv.Value);

        // ۳) ساخت قلم‌ها
        var lines = new List<BomLine>();
        foreach (var component in payload.ComponentsList)
        {
            var role = component.Role switch
            {
                "Optional" => BomItemRole.Optional,
                "Alternative" => BomItemRole.Alternative,
                _ => BomItemRole.Required,
            };

            // تعداد
            decimal qty;
            try
            {
                var formula = string.IsNullOrWhiteSpace(component.QtyFormula) ? "1" : component.QtyFormula!;
                qty = (decimal)ExpressionEvaluator.EvaluateNumber(formula, variables);
            }
            catch (Exception ex)
            {
                errors.Add($"قطعهٔ «{component.LogicalPartId}»: محاسبهٔ تعداد ناموفق — {ex.Message}");
                continue;
            }

            if (qty <= 0)
            {
                if (role == BomItemRole.Required)
                    errors.Add($"قطعهٔ الزامی «{component.LogicalPartId}» تعداد غیرمثبت دارد.");
                continue; // Optional/Alternative با صفر حذف می‌شود
            }

            var notes = component.Notes;
            if (component.AlternativesList.Count > 0)
                notes = string.IsNullOrWhiteSpace(notes)
                    ? $"جایگزین: {string.Join("، ", component.AlternativesList)}"
                    : notes + $" | جایگزین: {string.Join("، ", component.AlternativesList)}";

            if (!parts.TryGetValue(component.LogicalPartId, out var part))
            {
                if (role == BomItemRole.Required)
                {
                    errors.Add($"LogicalPart «{component.LogicalPartId}» در کاتالوگ وجود ندارد.");
                }
                else
                {
                    warnings.Add($"قطعهٔ اختیاری «{component.LogicalPartId}» در کاتالوگ موجود نیست و تأمین‌کننده‌ای ندارد؛ از BOM حذف می‌شود.");
                    lines.Add(new BomLine(
                        component.LogicalPartId, component.LogicalPartId, role, qty,
                        null, null, null, null, null, null, null, notes));
                }
                continue;
            }

            // ۴) انتخاب بهترین محصول تأمین‌کننده (ساده: ارزان‌ترین موجود؛ بعد: هر محصول)
            var candidates = productsByPart.TryGetValue(component.LogicalPartId, out var list)
                ? list.Where(p => p.IsActive).ToList()
                : new List<SupplierProduct>();

            ProviderPick? pick = null;
            if (candidates.Count > 0)
            {
                var inStock = candidates.Where(c => c.StockStatus == StockStatus.InStock).ToList();
                var low = inStock.Count == 0 ? candidates.Where(c => c.StockStatus == StockStatus.LowStock).ToList() : inStock;
                var chosen = (low.Count > 0 ? low : candidates)
                    .OrderBy(c => c.Price)
                    .First();
                pick = new ProviderPick(
                    chosen.Id, chosen.Supplier?.Name ?? "", chosen.Sku ?? "", chosen.Price,
                    chosen.StockStatus, chosen.Url);
                if (chosen.StockStatus is StockStatus.OutOfStock or StockStatus.Unknown)
                    warnings.Add($"محصول «{part.NameFa}» از {pick.Value.SupplierName} ناموجود است ({chosen.StockStatus}).");
            }

            if (pick is null)
            {
                warnings.Add($"قطعهٔ «{part.NameFa}» در حال حاضر تأمین‌کننده ندارد.");
                lines.Add(new BomLine(component.LogicalPartId, part.NameFa, role, qty, null, null, null, null, null, null, null, notes));
                continue;
            }

            var lineTotal = pick.Value.UnitPrice * qty;
            lines.Add(new BomLine(
                component.LogicalPartId, part.NameFa, role, qty,
                pick.Value.SupplierProductId, pick.Value.SupplierName, pick.Value.Sku,
                pick.Value.UnitPrice, lineTotal, pick.Value.StockStatus, pick.Value.Url, notes));
        }

        // ۵) اجرای قوانین فعال (داده‌پایه)
        foreach (var rule in rules.Where(r => r.IsActive))
            EvaluateRule(rule, lines, errors, warnings);

        // BOM نامعتبر اصلاً ساخته نمی‌شود (اگر خطایی بود IsValid=false)
        var total = lines.Where(l => l.UnitPrice.HasValue).Sum(l => l.LineTotal ?? 0);
        return new BomComputation(errors.Count == 0, errors, warnings, lines, total);
    }

    // ---------- پارامترها ----------

    private static Dictionary<string, object?> ResolveParameters(
        RecipePayload payload, IReadOnlyDictionary<string, object?> raw, List<string> errors)
    {
        var result = new Dictionary<string, object?>();
        foreach (var p in payload.ParametersList)
        {
            var hasValue = raw.TryGetValue(p.Key, out var rawValue) && rawValue is not null;
            object? value = hasValue ? rawValue : p.GetDefaultValue();

            switch (p.Type)
            {
                case "integer":
                {
                    var num = ToLong(value);
                    if (num is null)
                    {
                        errors.Add($"پارامتر «{p.Key}» عددی ارائه نشده/پیش‌فرض ندارد.");
                        continue;
                    }
                    if (p.Min.HasValue) num = Math.Max(p.Min.Value, num.Value);
                    if (p.Max.HasValue) num = Math.Min(p.Max.Value, num.Value);
                    result[p.Key] = num.Value;
                    break;
                }
                case "enum":
                {
                    var text = ToStringValue(value);
                    if (text is null || p.OptionsList.All(o => o.Value != text))
                    {
                        errors.Add($"پارامتر «{p.Key}»: مقدار «{text ?? "(خالی)"}» در گزینه‌ها نیست.");
                        continue;
                    }
                    result[p.Key] = text;
                    break;
                }
                case "boolean":
                    result[p.Key] = value switch
                    {
                        bool b => b,
                        string s => bool.TryParse(s, out var bb) ? bb : true,
                        long l => l != 0,
                        _ => true,
                    };
                    break;
            }
        }
        return result;
    }

    private static long? ToLong(object? v) => v switch
    {
        long l => l,
        int i => i,
        double d => (long)d,
        bool b => b ? 1 : 0,
        System.Text.Json.JsonElement e => e.ValueKind switch
        {
            System.Text.Json.JsonValueKind.Number => e.TryGetInt64(out var el) ? el : (long?)e.GetDouble(),
            System.Text.Json.JsonValueKind.True => 1,
            System.Text.Json.JsonValueKind.False => 0,
            System.Text.Json.JsonValueKind.String when long.TryParse(e.GetString(), System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out var es) => es,
            _ => null,
        },
        string s when long.TryParse(s, System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out var l) => l,
        _ => null,
    };

    private static string? ToStringValue(object? v) => v switch
    {
        string s => s,
        System.Text.Json.JsonElement e when e.ValueKind == System.Text.Json.JsonValueKind.String => e.GetString(),
        System.Text.Json.JsonElement e when e.ValueKind is System.Text.Json.JsonValueKind.True or System.Text.Json.JsonValueKind.False => e.GetBoolean().ToString(),
        _ => System.Convert.ToString(v, System.Globalization.CultureInfo.InvariantCulture),
    };

    // ---------- قوانین ----------

    private static void EvaluateRule(BomRuleDefinition rule, List<BomLine> lines, List<string> errors, List<string> warnings)
    {
        var message = rule.Code switch
        {
            "BOM-003" => lines.Any(l => l.Role == BomItemRole.Required && l.Quantity < 1)
                ? "یکی از قطعات الزامی تعداد نامعتبر دارد." : null,
            "BOM-002" => lines.Any(l => l.StockStatus is Shared.StockStatus.OutOfStock or Shared.StockStatus.Unknown)
                ? "برخی قطعات انتخاب‌شده ناموجود/نامشخص هستند؛ پیش از سفارش بررسی کنید." : null,
            "BOM-001" => lines.Any(l => l.Role == BomItemRole.Required && l.SupplierProductId is null)
                ? "قطعهٔ الزامی بدون تأمین‌کننده وجود دارد." : null,
            _ => null,
        };
        if (message is null) return;
        switch (rule.Severity)
        {
            case RuleSeverity.Error: errors.Add($"[{rule.Code}] {message}"); break;
            case RuleSeverity.Warning: warnings.Add($"[{rule.Code}] {message}"); break;
        }
    }

    private readonly record struct ProviderPick(
        long SupplierProductId, string SupplierName, string Sku, decimal UnitPrice,
        Shared.StockStatus StockStatus, string? Url);
}