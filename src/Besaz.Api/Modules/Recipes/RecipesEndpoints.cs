using System.Text.Json;
using Besaz.Api.Data;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Users;
using Besaz.Api.Shared;
using Besaz.Api.Http;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Recipes;

/// <summary>Endpointهای RecipeEngine — چرخهٔ Draft → UnderReview → Approved و قانون فورک/نسخه.</summary>
public static class RecipesEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = BesazJson.Options;

    public static IEndpointRouteBuilder MapRecipesEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/recipes")
    {
        var g = app.MapGroup(prefix);

        g.MapGet("/", ListRecipes);
        g.MapGet("/{id}", GetRecipe);
        g.MapGet("/{id}/versions/{versionId:long}", GetVersion);
        g.MapPost("/", CreateRecipe);
        g.MapPost("/{id}/versions", CreateVersion);
        g.MapPost("/{id}/submit", SubmitForReview);
        g.MapPost("/{id}/versions/{versionId:long}/approve", ApproveVersion);
        g.MapPost("/{id}/deprecate", Deprecate);
        g.MapPost("/{id}/archive", Archive);

        return app;
    }

    // ---------- DTO ها ----------

    public sealed record RecipeSummaryDto(
        string Id, string Slug, string Title, string Category, string Difficulty, string SafetyLevel,
        int EstimatedMinutes, string Status, string? CurrentVersion, string? Summary);

    public sealed record VersionDto(long Id, string Version, string Status, DateTimeOffset CreatedAt);

    public sealed record RecipeDetailDto(
        string Id, string Slug, string Title, string Category, string Difficulty, string SafetyLevel,
        int EstimatedMinutes, string Status, string? CurrentVersion, string? Summary, string? Description,
        string License, IReadOnlyList<VersionDto> Versions, RecipePayload Payload);

    public sealed record CreateRecipeRequest(string? RecipeId, string? Slug, string[] Changelog, JsonElement Payload);

    public sealed record ApprovalRequest(string ReviewerId, string ReviewerName, string Role, string Verdict, string? Note);

    // ---------- پیاده‌سازی ----------

    private static async Task<IResult> ListRecipes(AppDbContext db, string? status, string? search, string? category, int page = 1, int pageSize = 50)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        IQueryable<Recipe> q = db.Recipes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
        {
            var parsed = Enum.TryParse<RecipeStatus>(status, true, out var s) ? s : RecipeStatus.Approved;
            q = q.Where(r => r.Status == parsed);
        }
        if (!string.IsNullOrWhiteSpace(category))
            q = q.Where(r => r.Category == category);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(r => r.Title.Contains(search) || r.Summary!.Contains(search));

        var rows = await q
            .OrderBy(r => r.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RecipeSummaryDto(
                r.Id, r.Slug, r.Title, r.Category, r.Difficulty.ToWire(), r.SafetyLevel.ToWire(),
                r.EstimatedMinutes, r.Status.ToWire(), r.CurrentVersion, r.Summary))
            .ToListAsync();

        return Results.Ok(new { page, pageSize, items = rows });
    }

    private static async Task<IResult> GetRecipe(AppDbContext db, string id)
    {
        var recipe = await db.Recipes.Include(r => r.Versions).AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });

        var approved = recipe.Versions.Where(v => v.Status == RecipeStatus.Approved).MaxBy(v => v.CreatedAt);
        var payload = approved is null ? null : JsonSerializer.Deserialize<RecipePayload>(approved.PayloadJson, JsonOpts);

        var dto = new RecipeDetailDto(
            recipe.Id, recipe.Slug, recipe.Title, recipe.Category, recipe.Difficulty.ToWire(),
            recipe.SafetyLevel.ToWire(), recipe.EstimatedMinutes, recipe.Status.ToWire(),
            recipe.CurrentVersion, recipe.Summary, payload?.Description ?? recipe.Summary,
            payload?.LicenseValue ?? "CC-BY-NC-4.0",
            recipe.Versions.OrderByDescending(v => v.CreatedAt).Select(v => new VersionDto(v.Id, v.Version, v.Status.ToWire(), v.CreatedAt)).ToList(),
            payload!);
        return Results.Ok(dto);
    }

    private static async Task<IResult> GetVersion(AppDbContext db, string id, long versionId)
    {
        var version = await db.RecipeVersions.AsNoTracking().FirstOrDefaultAsync(v => v.RecipeId == id && v.Id == versionId);
        if (version is null) return Results.NotFound(new { message = "نسخه یافت نشد." });
        try
        {
            var payload = JsonSerializer.Deserialize<RecipePayload>(version.PayloadJson, JsonOpts);
            return Results.Ok(new { version.Id, version.Version, status = version.Status.ToWire(), payload });
        }
        catch (Exception ex)
        {
            return Results.Problem($"payload نسخه خراب است: {ex.Message}", statusCode: 500);
        }
    }

    private static async Task<IResult> CreateRecipe(AppDbContext db, CreateRecipeRequest req, HttpRequest http)
    {
        var (userId, userName) = UserContext.Resolve(http);
        RecipePayload payload;
        try { payload = req.Payload.Deserialize<RecipePayload>(JsonOpts) ?? throw new InvalidOperationException("payload خالی است."); }
        catch (Exception ex) { return Results.BadRequest(new { errors = new[] { $"payload نامعتبر: {ex.Message}" } }); }

        var errors = RecipeValidator.Validate(payload);
        if (errors.Count > 0) return Results.BadRequest(new { errors });

        var id = string.IsNullOrWhiteSpace(req.RecipeId) ? GenerateId(payload.Title) : req.RecipeId.Trim();
        var slug = string.IsNullOrWhiteSpace(req.Slug) ? Slugify(payload.Title) : req.Slug.Trim();

        if (await db.Recipes.AnyAsync(r => r.Id == id)) return Results.Conflict(new { message = $"شناسهٔ «{id}» تکراری است." });

        var now = DateTimeOffset.UtcNow;
        var recipe = new Recipe
        {
            Id = id, Slug = slug, Title = payload.Title, Category = payload.Category,
            Difficulty = payload.Difficulty, SafetyLevel = payload.SafetyLevel,
            EstimatedMinutes = payload.EstimatedMinutes, Status = RecipeStatus.Draft,
            CurrentVersion = "0.1.0", Summary = payload.Summary, CreatedAt = now, UpdatedAt = now,
        };
        var version = new RecipeVersion
        {
            Version = "0.1.0", Status = RecipeStatus.Draft,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOpts),
            ChangelogJson = JsonSerializer.Serialize(req.Changelog.Length > 0 ? req.Changelog : new[] { "ایجاد اولیه" }),
            CreatedAt = now,
        };
        recipe.Versions.Add(version);
        db.Recipes.Add(recipe);
        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = now, EntityType = "Recipe", EntityId = id, Action = "Created",
            ActorId = userId.ToString(), DataJson = JsonSerializer.Serialize(new { summary = payload.Summary }),
        });
        await db.SaveChangesAsync();

        return Results.Created($"/api/recipes/{id}", new { id, slug, version = version.Version, status = "Draft" });
    }

    private static async Task<IResult> CreateVersion(AppDbContext db, string id, CreateRecipeRequest req, HttpRequest http)
    {
        var (userId, _) = UserContext.Resolve(http);
        var recipe = await db.Recipes.Include(r => r.Versions).FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });

        RecipePayload payload;
        try { payload = req.Payload.Deserialize<RecipePayload>(JsonOpts) ?? throw new InvalidOperationException("payload خالی است."); }
        catch (Exception ex) { return Results.BadRequest(new { errors = new[] { $"payload نامعتبر: {ex.Message}" } }); }

        var errors = RecipeValidator.Validate(payload);
        if (errors.Count > 0) return Results.BadRequest(new { errors });

        // bump minor
        var parts = recipe.CurrentVersion?.Split('.') ?? new[] { "0", "1", "0" };
        var next = $"{parts[0]}.{(int.TryParse(parts.ElementAtOrDefault(1), out var mi) ? mi + 1 : 1)}.{parts.ElementAtOrDefault(2) ?? "0"}";

        var now = DateTimeOffset.UtcNow;
        var version = new RecipeVersion
        {
            Version = next, Status = RecipeStatus.Draft,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOpts),
            ChangelogJson = JsonSerializer.Serialize(req.Changelog.Length > 0 ? req.Changelog : new[] { "نسخهٔ جدید" }),
            CreatedAt = now,
        };
        recipe.Versions.Add(version);
        recipe.CurrentVersion = next;
        recipe.Status = RecipeStatus.Draft; // نیاز به بازبینی مجدد — قانون ۱ و ۲
        recipe.UpdatedAt = now;
        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = now, EntityType = "RecipeVersion", EntityId = $"{id}@{next}", Action = "Created",
            ActorId = userId.ToString(),
        });
        await db.SaveChangesAsync();
        return Results.Created($"/api/recipes/{id}/versions/{version.Id}", new { version.Id, version.Version, status = "Draft" });
    }

    /// <summary>Draft → UnderReview: فقط نسخهٔ جاریِ Draft قابل ارسال است.</summary>
    private static async Task<IResult> SubmitForReview(AppDbContext db, string id, HttpRequest http)
    {
        var (userId, _) = UserContext.Resolve(http);
        var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });
        if (recipe.Status != RecipeStatus.Draft)
            return Results.BadRequest(new { message = $"فقط نسخهٔ Draft قابل ارسال است (وضعیت فعلی: {recipe.Status.ToWire()})." });

        recipe.Status = RecipeStatus.UnderReview;
        recipe.UpdatedAt = DateTimeOffset.UtcNow;
        db.AuditLogs.Add(new AuditLog { Timestamp = DateTimeOffset.UtcNow, EntityType = "Recipe", EntityId = id, Action = "Submitted", ActorId = userId.ToString() });
        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = "UnderReview" });
    }

    /// <summary>تأیید نسخه — قانون ۳: HIGH/CRITICAL هر دو بازبین؛ LOW/MEDIUM یک بازبین فنی.</summary>
    private static async Task<IResult> ApproveVersion(AppDbContext db, string id, long versionId, ApprovalRequest req)
    {
        var version = await db.RecipeVersions.Include(v => v.Recipe).FirstOrDefaultAsync(v => v.RecipeId == id && v.Id == versionId);
        if (version is null) return Results.NotFound(new { message = "نسخه یافت نشد." });
        if (version.Status is RecipeStatus.Approved or RecipeStatus.Archived)
            return Results.BadRequest(new { message = $"وضعیت «{version.Status.ToWire()}» اجازهٔ تأیید نمی‌دهد." });
        if (req.Role is not ("technical" or "safety"))
            return Results.BadRequest(new { message = "نقش بازبین باید technical یا safety باشد." });

        var existing = await db.SafetyApprovals
            .Where(a => a.RecipeVersionId == versionId && a.Role == req.Role)
            .FirstOrDefaultAsync();

        var payload = JsonSerializer.Deserialize<RecipePayload>(version.PayloadJson, JsonOpts);

        if (req.Verdict == "Rejected")
        {
            if (existing is null)
            {
                db.SafetyApprovals.Add(new SafetyApproval
                {
                    RecipeVersionId = versionId, ReviewerId = req.ReviewerId, ReviewerName = req.ReviewerName,
                    Role = req.Role, Verdict = "Rejected", Note = req.Note, CreatedAt = DateTimeOffset.UtcNow,
                });
            }
            else
            {
                existing.Verdict = "Rejected";
                existing.Note = req.Note;
            }
            version.Status = RecipeStatus.Rejected;   // بازگشت با نظرات → قانون طلایی
            version.Recipe!.Status = RecipeStatus.Rejected;
            version.Recipe.UpdatedAt = DateTimeOffset.UtcNow;
            db.AuditLogs.Add(new AuditLog { Timestamp = DateTimeOffset.UtcNow, EntityType = "RecipeVersion", EntityId = $"{id}@{version.Version}", Action = "Rejected", ActorId = req.ReviewerId, DataJson = JsonSerializer.Serialize(new { role = req.Role, note = req.Note }) });
            await db.SaveChangesAsync();
            return Results.Ok(new { id, version = version.Version, status = "Rejected" });
        }

        if (existing is null)
        {
            db.SafetyApprovals.Add(new SafetyApproval
            {
                RecipeVersionId = versionId, ReviewerId = req.ReviewerId, ReviewerName = req.ReviewerName,
                Role = req.Role, Verdict = "Approved", Note = req.Note, CreatedAt = DateTimeOffset.UtcNow,
            });
        }
        else
        {
            existing.Verdict = "Approved";
            existing.Note = req.Note;
        }

        // دروازهٔ ایمنی: جمع‌بندی تأییدها
        var approvals = await db.SafetyApprovals.Where(a => a.RecipeVersionId == versionId).ToListAsync();
        var needsBoth = payload?.SafetyLevel is SafetyLevel.High or SafetyLevel.Critical;
        var technicalOk = approvals.Any(a => a.Role == "technical" && a.Verdict == "Approved");
        var safetyOk = needsBoth ? approvals.Any(a => a.Role == "safety" && a.Verdict == "Approved") : true;

        if (needsBoth && !safetyOk)
            return Results.Accepted($"/api/recipes/{id}/versions/{versionId}/approve", new { message = "برای سطح HIGH/CRITICAL تأیید بازبین ایمنی نیز لازم است.", approved = false });

        if (!technicalOk)
            return Results.Accepted($"/api/recipes/{id}/versions/{versionId}/approve", new { message = "تأیید بازبین فنی لازم است.", approved = false });

        version.Status = RecipeStatus.Approved;
        version.Recipe!.Status = RecipeStatus.Approved;
        version.Recipe.CurrentVersion = version.Version;
        version.Recipe.UpdatedAt = DateTimeOffset.UtcNow;
        db.AuditLogs.Add(new AuditLog { Timestamp = DateTimeOffset.UtcNow, EntityType = "RecipeVersion", EntityId = $"{id}@{version.Version}", Action = "Approved", ActorId = req.ReviewerId, DataJson = JsonSerializer.Serialize(new { role = req.Role }) });
        await db.SaveChangesAsync();
        return Results.Ok(new { id, version = version.Version, status = "Approved", approved = true });
    }

    private static async Task<IResult> Deprecate(AppDbContext db, string id, HttpRequest http)
    {
        var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });
        recipe.Status = RecipeStatus.Deprecated;
        recipe.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = "Deprecated" });
    }

    private static async Task<IResult> Archive(AppDbContext db, string id, HttpRequest http)
    {
        var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });
        if (recipe.Status is not (RecipeStatus.Deprecated or RecipeStatus.Rejected or RecipeStatus.Draft))
            return Results.BadRequest(new { message = "فقط نسخهٔ Deprecated/Rejected/Draft بایگانی می‌شود." });
        recipe.Status = RecipeStatus.Archived;
        recipe.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = "Archived" });
    }

    private static string GenerateId(string title)
    {
        // مثال: "چراغ LED USB" → "R-1" (تولید ساده؛ در فاز بعد شماره‌گذار جدی)
        var hash = Math.Abs(title.GetHashCode()) % 90 + 10;
        return $"R-{hash}";
    }

    private static string Slugify(string text) =>
        string.Concat(text.Where(char.IsLetterOrDigit).Select(c => char.IsWhiteSpace(c) ? '-' : c)).ToLowerInvariant();
}