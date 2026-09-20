using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Recipes;

/// <summary>
/// اعتبارسنجی بدنهٔ Recipe — قبل از ثبت هر نسخه اجرا می‌شود.
/// قانون ۳ سند: تأیید RECIPE در سطح HIGH/CRITICAL (جدا از این اعتبارسنجی ساختاری)
/// به‌وسیلهٔ دو بازبین (فنی + ایمنی) انجام می‌شود.
/// </summary>
public static class RecipeValidator
{
    public static IReadOnlyList<string> Validate(RecipePayload payload)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(payload.Title) || payload.Title.Trim().Length < 3)
            errors.Add("عنوان باید حداقل ۳ حرف باشد.");

        if (string.IsNullOrWhiteSpace(payload.Category))
            errors.Add("دسته‌بندی الزامی است.");

        if (payload.EstimatedMinutes <= 0)
            errors.Add("زمان تقریبی باید بزرگ‌تر از صفر باشد.");

        if (payload.SkillsList.Count == 0)
            errors.Add("حداقل یک مهارت پیش‌نیاز ذکر شود.");

        if (payload.ToolsList.Count == 0)
            errors.Add("حداقل یک ابزار ذکر شود.");

        if (payload.ComponentsList.Count == 0)
            errors.Add("حداقل یک قطعه (Component) الزامی است.");

        if (payload.StepsList.Count == 0)
            errors.Add("حداقل یک گام ساخت (Step) الزامی است.");

        if (string.IsNullOrWhiteSpace(payload.LicenseValue))
            errors.Add("لایسنس الزامی است.");

        // ایمنی: HIGH/CRITICAL بدون هشدار ایمنی پذیرفته نیست
        if (payload.SafetyLevel is SafetyLevel.High or SafetyLevel.Critical && payload.SafetyWarningsList.Count == 0)
            errors.Add("Recipe با سطح ایمنی HIGH/CRITICAL باید حداقل یک هشدار ایمنی داشته باشد.");

        // پارامترها
        var keys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var p in payload.ParametersList)
        {
            if (string.IsNullOrWhiteSpace(p.Key) || !System.Text.RegularExpressions.Regex.IsMatch(p.Key, "^[a-zA-Z][a-zA-Z0-9_]*$"))
            {
                errors.Add($"کلید پارامتر نامعتبر: «{p.Key ?? ""}» (الگو: حرف لاتین شروع و سپس حروف/عدد/زیرخط).");
                continue;
            }
            if (!keys.Add(p.Key))
            {
                errors.Add($"کلید پارامتر تکراری: «{p.Key}».");
                continue;
            }

            switch (p.Type)
            {
                case "integer":
                    if (p.Min.HasValue && p.Max.HasValue && p.Min > p.Max)
                        errors.Add($"پارامتر «{p.Key}»: min بزرگ‌تر از max است.");
                    break;
                case "enum":
                    if (p.OptionsList.Count == 0)
                        errors.Add($"پارامتر «{p.Key}»: گزینه‌های enum خالی است.");
                    else if (p.GetDefaultValue() is string def && p.OptionsList.All(o => o.Value != def))
                        errors.Add($"پارامتر «{p.Key}»: مقدار پیش‌فرض «{def}» در گزینه‌ها نیست.");
                    break;
                case "boolean":
                    break;
                default:
                    errors.Add($"پارامتر «{p.Key}»: نوع نامعتبر «{p.Type}» (integer/enum/boolean).");
                    break;
            }
        }

        // قطعات
        // فرمول‌های تعداد می‌توانند به پارامترهای اعلام‌شده ارجاع بدهند؛
        // بنابراین دیکشنری متغیرها از کلیدهای معتبر پارامترها ساخته می‌شود (نه خالی).
        var formulaVars = keys.ToDictionary(k => k, _ => (object?)0L, StringComparer.Ordinal);
        var partIds = new HashSet<string>(payload.ComponentsList.Select(c => c.LogicalPartId));
        foreach (var c in payload.ComponentsList)
        {
            if (string.IsNullOrWhiteSpace(c.LogicalPartId))
            {
                errors.Add("logicalPartId یک قطعه خالی است.");
                continue;
            }
            if (c.Role is not ("Required" or "Optional" or "Alternative"))
                errors.Add($"قطعه «{c.LogicalPartId}»: نقش نامعتبر «{c.Role}» (Required/Optional/Alternative).");
            foreach (var alt in c.AlternativesList)
            {
                if (string.IsNullOrWhiteSpace(alt))
                    errors.Add($"قطعه «{c.LogicalPartId}»: جایگزین خالی دارد.");
            }
            if (!string.IsNullOrWhiteSpace(c.QtyFormula))
            {
                try
                {
                    ExpressionEvaluator.Evaluate(c.QtyFormula, formulaVars);
                }
                catch (Exception ex)
                {
                    errors.Add($"قطعه «{c.LogicalPartId}»: فرمول تعداد نامعتبر است — {ex.Message}");
                }
            }
        }

        _ = partIds; // برای توسعهٔ آتی (بررسی ارجاع به parts مجهول فقط در زمان BOM)
        return errors;
    }
}