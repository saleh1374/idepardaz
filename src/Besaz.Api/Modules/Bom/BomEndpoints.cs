using System.Text.Json;
using Besaz.Api.Data;
using Besaz.Api.Modules.Projects;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Users;
using Besaz.Api.Http;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Bom;

/// <summary>BOM Engine + Project (بخش ۱۱ سند) — اتصال دیتای کاربر به سبد قطعات.</summary>
public static class BomEndpoints
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public static IEndpointRouteBuilder MapBomEndpoints(this IEndpointRouteBuilder app)
    {
        var bom = app.MapGroup("/api/bom");
        bom.MapPost("/generate", Generate);
        bom.MapGet("/{id:long}", GetBom);

        var projects = app.MapGroup("/api/projects");
        projects.MapPost("/", CreateProject);
        projects.MapGet("/", ListProjects);
        projects.MapGet("/{id:long}", GetProject);
        projects.MapGet("/{id:long}/bom", GetBomForProject);
        projects.MapPatch("/{id:long}/status", ChangeStatus);

        return app;
    }

    public sealed record GenerateRequest(string RecipeId, int? VersionId, Dictionary<string, JsonElement>? Parameters, long? ProjectId = null);
    public sealed record CreateProjectRequest(string? Title, string RecipeId, int? VersionId, Dictionary<string, JsonElement>? Parameters);
    public sealed record ChangeStatusRequest(string Status);

    // ---------- BOM ----------

    private static async Task<IResult> Generate(AppDbContext db, BomEngine engine, GenerateRequest req)
    {
        var result = await engine.GenerateAsync(new BomEngine.GenerateRequest(
            req.RecipeId, req.VersionId, NormalizeParams(req.Parameters), req.ProjectId), CancellationToken.None);

        var payload = new
        {
            isValid = result.IsValid,
            errors = result.Errors,
            warnings = result.Warnings,
            bomId = result.BomId,
            total = result.Total,
            recipeTitle = result.RecipeTitle,
            recipeVersion = result.RecipeVersion,
            items = result.Items,
        };
        return result.IsValid ? Results.Ok(payload) : Results.UnprocessableEntity(payload);
    }

    private static async Task<IResult> GetBom(AppDbContext db, long id)
    {
        var bom = await db.Boms.Include(b => b.Items).AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (bom is null) return Results.NotFound(new { message = "BOM یافت نشد." });
        return Results.Ok(new
        {
            id = bom.Id,
            recipeId = bom.RecipeId,
            recipeVersion = bom.RecipeVersionText,
            projectId = bom.ProjectId,
            isValid = bom.IsValid,
            total = bom.Total,
            createdAt = bom.CreatedAt,
            items = bom.Items.Select(i => new
            {
                id = i.Id,
                logicalPartId = i.LogicalPartId,
                name = i.LogicalPartName,
                role = i.Role.ToString(),
                quantity = i.Quantity,
                supplier = i.SupplierName,
                sku = i.Sku,
                unitPrice = i.UnitPrice,
                lineTotal = i.LineTotal,
                stock = i.StockStatus?.ToString(),
                url = i.Url,
                notes = i.Notes,
            }),
        });
    }

    // ---------- Project ----------

    private static async Task<IResult> CreateProject(AppDbContext db, BomEngine engine, CreateProjectRequest req, HttpRequest http)
    {
        var (userId, userName) = UserContext.Resolve(http);

        var recipe = await db.Recipes
            .Include(r => r.Versions)
            .FirstOrDefaultAsync(r => r.Id == req.RecipeId);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });

        var version = req.VersionId.HasValue
            ? recipe.Versions.FirstOrDefault(v => v.Id == req.VersionId.Value)
            : recipe.Versions.Where(v => v.Status == Shared.RecipeStatus.Approved).MaxBy(v => v.CreatedAt);
        if (version is null)
            return Results.BadRequest(new { message = "نسخهٔ Approved موجود نیست." });

        var now = DateTimeOffset.UtcNow;
        var project = new Project
        {
            Title = string.IsNullOrWhiteSpace(req.Title) ? recipe.Title : req.Title.Trim(),
            UserId = userId,
            UserDisplayName = userName,
            RecipeId = recipe.Id,
            RecipeVersionText = $"{recipe.Id}@{version.Version}",
            ParametersJson = JsonSerializer.Serialize(req.Parameters ?? new Dictionary<string, JsonElement>(), JsonOpts),
            Status = ProjectStatus.Planning,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync(); // دریافت Id پروژه پیش از ساخت BOM

        var bomResult = await engine.GenerateAsync(new BomEngine.GenerateRequest(
            req.RecipeId, req.VersionId, NormalizeParams(req.Parameters), project.Id), CancellationToken.None);

        if (!bomResult.IsValid)
        {
            project.Status = ProjectStatus.Draft; // BOM نامعتبر → پروژه فقط در Draft می‌ماند
            project.UpdatedAt = now;
            await db.SaveChangesAsync();
            return Results.UnprocessableEntity(new { projectId = project.Id, errors = bomResult.Errors, warnings = bomResult.Warnings });
        }

        project.BomId = bomResult.BomId;
        project.Status = ProjectStatus.BomReady;
        project.UpdatedAt = now;

        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = now, EntityType = "Project", EntityId = project.Id.ToString(),
            Action = "Created", ActorId = userId.ToString(),
            DataJson = JsonSerializer.Serialize(new { recipe = project.RecipeVersionText }),
        });
        await db.SaveChangesAsync();

        return Results.Created($"/api/projects/{project.Id}", new
        {
            project = new
            {
                id = project.Id,
                title = project.Title,
                recipeId = project.RecipeId,
                recipeVersion = project.RecipeVersionText,
                status = project.Status.ToString(),
                bomId = project.BomId,
            },
            bom = new
            {
                isValid = bomResult.IsValid,
                total = bomResult.Total,
                items = bomResult.Items,
                warnings = bomResult.Warnings,
            },
        });
    }

    private static async Task<IResult> ListProjects(AppDbContext db, Guid? userId, int page = 1, int pageSize = 50)
    {
        IQueryable<Project> q = db.Projects.AsNoTracking();
        if (userId.HasValue) q = q.Where(p => p.UserId == userId.Value);
        var all = (await q.ToListAsync()).OrderByDescending(p => p.CreatedAt).ToList();
        var rows = all
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(p => new
            {
                id = p.Id, title = p.Title, recipeId = p.RecipeId,
                recipeVersion = p.RecipeVersionText, status = p.Status.ToString(),
                bomId = p.BomId, createdAt = p.CreatedAt,
            })
            .ToList();
        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    private static async Task<IResult> GetProject(AppDbContext db, long id)
    {
        var project = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return Results.NotFound(new { message = "پروژه یافت نشد." });
        return Results.Ok(new
        {
            id = project.Id, title = project.Title, description = project.Description,
            userDisplayName = project.UserDisplayName, recipeId = project.RecipeId,
            recipeVersion = project.RecipeVersionText, status = project.Status.ToString(),
            isPublic = project.IsPublic, bomId = project.BomId,
            parameters = JsonSerializer.Deserialize<JsonElement>(project.ParametersJson),
            createdAt = project.CreatedAt, updatedAt = project.UpdatedAt,
        });
    }

    /// <summary>انتقال وضعیت Project (بخش ۱۱) — فقط رو به جلو؛ با AuditLog.</summary>
    private static async Task<IResult> ChangeStatus(AppDbContext db, long id, ChangeStatusRequest req, HttpRequest http)
    {
        var (userId, _) = UserContext.Resolve(http);
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return Results.NotFound(new { message = "پروژه یافت نشد." });

        if (!Enum.TryParse<ProjectStatus>(req.Status, true, out var next))
            return Results.BadRequest(new { message = $"وضعیت نامعتبر: «{req.Status}»." });
        if (next < project.Status)
            return Results.BadRequest(new { message = $"بازگشت وضعیت مجاز نیست ({project.Status} ← {next})." });
        if (next <= project.Status)
            return Results.Ok(new { id, status = project.Status.ToString() });

        project.Status = next;
        project.UpdatedAt = DateTimeOffset.UtcNow;
        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTimeOffset.UtcNow, EntityType = "Project", EntityId = id.ToString(),
            Action = "StatusChanged", ActorId = userId.ToString(),
            DataJson = JsonSerializer.Serialize(new { from = project.Status.ToString(), to = next.ToString() }),
        });
        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = next.ToString() });
    }

    /// <summary>دریافت BOM یک پروژه بر اساس BomId ذخیره‌شده.</summary>
    private static async Task<IResult> GetBomForProject(AppDbContext db, long id)
    {
        var project = await db.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return Results.NotFound(new { message = "پروژه یافت نشد." });
        if (!project.BomId.HasValue)
            return Results.Ok(new { isValid = false, bomId = (long?)null, total = (decimal?)null, recipeTitle = "", recipeVersion = "", items = Array.Empty<object>(), errors = new[] { "BOM برای این پروژه هنوز ساخته نشده." }, warnings = Array.Empty<string>() });

        var bom = await db.Boms
            .Include(b => b.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == project.BomId.Value);
        if (bom is null)
            return Results.Ok(new { isValid = false, bomId = project.BomId, total = (decimal?)null, recipeTitle = "", recipeVersion = "", items = Array.Empty<object>(), errors = new[] { "BOM یافت نشد." }, warnings = Array.Empty<string>() });

        return Results.Ok(new
        {
            isValid = bom.IsValid,
            bomId = bom.Id,
            total = bom.Total,
            recipeTitle = bom.RecipeId ?? "",
            recipeVersion = bom.RecipeVersionText ?? "",
            errors = System.Text.Json.JsonSerializer.Deserialize<string[]>(bom.ValidationMessagesJson ?? "[]") ?? Array.Empty<string>(),
            warnings = Array.Empty<string>(),
            items = bom.Items.Select(i => new
            {
                i.LogicalPartId, i.LogicalPartName, i.Role, i.Quantity,
                i.SupplierName, i.Sku, i.UnitPrice, i.LineTotal, i.StockStatus, i.Url,
            }),
        });
    }

    /// <summary>تبدیل Dictionary&lt;string, JsonElement&gt; به Dictionary با مقادیر سادهٔ .NET.</summary>
    private static IReadOnlyDictionary<string, object?> NormalizeParams(Dictionary<string, JsonElement>? raw)
    {
        var result = new Dictionary<string, object?>();
        if (raw is null) return result;
        foreach (var (key, value) in raw)
        {
            result[key] = value.ValueKind switch
            {
                JsonValueKind.Number when value.TryGetInt64(out var l) => l,
                JsonValueKind.Number => value.GetDouble(),
                JsonValueKind.String => value.GetString(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => null,
            };
        }
        return result;
    }
}