using System.Text.Json;
using Besaz.Api.Data;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Ai;

/// <summary>خروجی ساخت‌یافته‌ی Intent (لایهٔ ۲ معماری ۷ لایه).</summary>
public sealed record IntentResult(
    string Intent,
    IReadOnlyList<string> Requirements,
    IReadOnlyList<string> MissingRequirements,
    string? RecommendedRecipeId,
    double Confidence,
    IReadOnlyList<string> Warnings);

public sealed class IntentEngine
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private readonly AppDbContext _db;
    private readonly IAiProvider _provider;

    public IntentEngine(AppDbContext db, IAiProvider provider)
    {
        _db = db;
        _provider = provider;
    }

    public sealed record CatalogEntry(string Id, string Title, string Summary, string Keywords);

    /// <summary>
    /// فهم درخواست فارسی → انتخاب/پیشنهاد Recipe با خروجی ساخت‌یافته.
    /// اگر Provider واقعی پیکربندی نشده باشد، از StubMatcher قطعی (آفلاین و رایگان) استفاده می‌شود —
    /// به همین دلیل هزینهٔ AI فاز صفر تقریباً صفر است.
    /// </summary>
    public async Task<IntentResult> UnderstandAsync(string text, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new IntentResult("unknown", Array.Empty<string>(), new[] { "درخواست خالی است." }, null, 0, Array.Empty<string>());

        var catalog = await BuildCatalogAsync(ct);

        if (_provider.IsConfigured)
        {
            try
            {
                var prompt = string.Join("\n", catalog.Select(c => $"- {c.Id}: {c.Title} | {c.Summary} | کلمات کلیدی: {c.Keywords}"));
                var userPrompt = $"درخواست کاربر: «{text}»\nکاتالوگ Recipeها:\n{prompt}\n" +
                                 "خروجی را فقط به‌صورت JSON بده: {intent, requirements:[], missingRequirements:[], recommendedRecipeId, confidence, warnings:[]}";
                var system = "تو دستیار انتخاب Recipe در پلتفرم بساز هستی؛ فقط از کاتالوگ داده‌شده انتخاب کن. فارسی جواب بده. اگر چیزی در کاتالوگ نبود recommendedRecipeId را null بگذار و warning بده.";
                var result = await _provider.ChatAsync(new AiChatRequest(userPrompt, system, "intentResult"), ct);
                var intent = Parse(result.StructuredJson);
                if (intent is not null && !string.Equals(intent.RecommendedRecipeId, "null", StringComparison.OrdinalIgnoreCase))
                    return intent;
            }
            catch
            {
                // افتادن به StubMatcher — منبع خطا باید در لاگ ثبت شود (Serilog در Program)
            }
        }

        return StubMatcher.Recommend(text, catalog);
    }

    private static IntentResult? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            string? recipeId = null;
            if (root.TryGetProperty("recommendedRecipeId", out var r) && r.ValueKind == JsonValueKind.String)
                recipeId = r.GetString();
            return new IntentResult(
                root.TryGetProperty("intent", out var i) && i.ValueKind == JsonValueKind.String ? i.GetString()! : "unknown",
                ReadStrings(root, "requirements"),
                ReadStrings(root, "missingRequirements"),
                recipeId,
                root.TryGetProperty("confidence", out var c) && c.TryGetDouble(out var cd) ? cd : 0,
                ReadStrings(root, "warnings"));
        }
        catch
        {
            return null;
        }
    }

    private static string[] ReadStrings(JsonElement root, string prop)
    {
        if (!root.TryGetProperty(prop, out var e) || e.ValueKind != JsonValueKind.Array) return Array.Empty<string>();
        return e.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!).ToArray();
    }

    private async Task<List<CatalogEntry>> BuildCatalogAsync(CancellationToken ct)
    {
        return await _db.Recipes
            .Where(r => r.Status == RecipeStatus.Approved)
            .AsNoTracking()
            .Select(r => new CatalogEntry(r.Id, r.Title, r.Summary ?? "", r.Category + " " + r.Title))
            .ToListAsync(ct);
    }
}

/// <summary>
/// تطبیق قطعی و آفلاین برای فاز صفر: امتیازدهی کلمات کلیدی فارسی روی کاتالوگ Recipeها.
/// این پیاده‌سازی «قراردادهای ممنوعه» را هم اعمال می‌کند: باتری/برق شهر → هشدار ایمنی، بدون Recipe تأییدشده.
/// </summary>
public static class StubMatcher
{
    private static readonly (string Word, string Warning)[] DangerWords =
    {
        ("باتری", "این درخواست با باتری لیتیومی مرتبط است؛ فقط از Recipe تأییدشدهٔ «پاوربانک USB-C» استفاده کنید."),
        ("لیتیوم", "این درخواست با باتری لیتیومی مرتبط است؛ فقط از Recipe تأییدشدهٔ «پاوربانک USB-C» استفاده کنید."),
        ("برق شهر", "مدار برق شهر (CRITICAL) در MVP ارائه نمی‌شود — قانون ثابت پلتفرم."),
        ("۲۲۰", "مدار برق شهر (CRITICAL) در MVP ارائه نمی‌شود — قانون ثابت پلتفرم."),
    };

    /// <summary>
    /// کلمات نقشی/ادب فارسی که هیچ ارزش جستجویی ندارند و باعث تطبیق کاذب می‌شوند
    /// (مثال: «یک» در سؤال نامرتبط با «یک چراغ مطالعه» در خلاصهٔ یک Recipe جور می‌شود).
    /// </summary>
    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "یک", "دو", "چند", "این", "آن", "اینکه", "با", "از", "به", "برای", "که", "را",
        "و", "در", "من", "تو", "او", "ما", "شما", "لطفاً", "لطفا", "خواهش", "میکنم",
        "می‌کنم", "می‌خواهم", "میخواهم", "میخوام", "هستم", "هست", "است", "دارم", "نیاز",
        "ساخت", "ساختن", "بساز", "بسازم", "بسازید", "میشه", "میشود", "می‌شود",
    };

    public static IntentResult Recommend(string text, IReadOnlyList<IntentEngine.CatalogEntry> catalog)
    {
        var normalized = text.ToLowerInvariant();
        var warnings = new List<string>();

        // قراردادهای ممنوعه
        foreach (var (word, warning) in DangerWords)
            if (normalized.Contains(word, StringComparison.Ordinal))
                warnings.Add(warning);

        // امتیازدهی: حروف مشترک کلمات
        var tokens = normalized
            .Split(new[] { ' ', '\t', '،', '.', '؟', '!', ':', '|' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 2 && !StopWords.Contains(t))
            .ToArray();

        KeyValuePair<IntentEngine.CatalogEntry, int>? best = null;
        foreach (var entry in catalog)
        {
            var hay = (entry.Title + " " + entry.Summary + " " + entry.Keywords).ToLowerInvariant();
            var score = tokens.Count(t => ContainsWord(hay, t));
            if (best is null || score > best.Value.Value)
                best = new KeyValuePair<IntentEngine.CatalogEntry, int>(entry, score);
        }

        if (best is null || best.Value.Value == 0)
            return new IntentResult(
                "no_recipe",
                Array.Empty<string>(),
                new[] { "هیچ Recipe تأییدشده‌ای با این درخواست پیدا نشد؛ پرسش خود را دقیق‌تر بپرسید." },
                null,
                0.1,
                warnings);

        var confidence = Math.Min(0.95, 0.35 + best.Value.Value * 0.2);
        return new IntentResult(
            "recipe_selected",
            tokens.Where(t => ContainsWord((best.Value.Key.Title + " " + best.Value.Key.Summary).ToLowerInvariant(), t)).ToArray(),
            Array.Empty<string>(),
            best.Value.Key.Id,
            Math.Round(confidence, 2),
            warnings);
    }

    private static bool ContainsWord(string haystack, string token)
    {
        if (token.Length < 3) return haystack.Contains(token, StringComparison.Ordinal);
        // تطبیق زیررشتهٔ کوتاه برای کلمات فارسی بدون ریشه‌یابی
        return haystack.Contains(token, StringComparison.Ordinal)
               || haystack.Contains(token[..Math.Min(4, token.Length)], StringComparison.Ordinal);
    }
}