using Besaz.Api.Data;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Admin;

/// <summary>
/// پنل مدیریت — داشبورد + مدیریت کاربران + تأیید/رد Recipe + مدیریت سفارشات.
/// احراز هویت واقعی نقش در فاز بعد اضافه می‌شود.
/// </summary>
public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/admin");

        // Dashboard
        g.MapGet("/dashboard", Dashboard);

        // Users
        g.MapGet("/users", ListUsers);
        g.MapPatch("/users/{id:guid}/role", ChangeUserRole);

        // Recipes
        g.MapGet("/recipes/pending", PendingRecipes);
        g.MapPost("/recipes/{id}/approve", ApproveRecipe);
        g.MapPost("/recipes/{id}/reject", RejectRecipe);

        // Orders
        g.MapGet("/orders", ListAllOrders);

        // Audit log
        g.MapGet("/audit", ListAuditLog);

        return app;
    }

    public sealed record ChangeRoleRequest(string Role);

    // ---------- Dashboard ----------

    private static async Task<IResult> Dashboard(AppDbContext db)
    {
        var recipeCount = await db.Recipes.CountAsync();
        var approvedCount = await db.Recipes.CountAsync(r => r.Status == RecipeStatus.Approved);
        var pendingCount = await db.Recipes.CountAsync(r => r.Status == RecipeStatus.UnderReview);
        var userCount = await db.Users.CountAsync();
        var projectCount = await db.Projects.CountAsync();
        var orderCount = await db.Orders.CountAsync();
        var partCount = await db.LogicalParts.CountAsync();
        var supplierCount = await db.Suppliers.CountAsync(s => s.IsActive);

        var recentProjectsRaw = await db.Projects.ToListAsync();
        var recentProjects = recentProjectsRaw
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new { p.Id, p.Title, p.RecipeId, Status = p.Status.ToString(), p.CreatedAt })
            .ToList();

        var recentOrdersRaw = await db.Orders.ToListAsync();
        var recentOrders = recentOrdersRaw
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new { o.Id, o.ProjectId, o.Status, o.Total, o.CreatedAt })
            .ToList();

        return Results.Ok(new
        {
            stats = new
            {
                recipes = recipeCount,
                approvedRecipes = approvedCount,
                pendingRecipes = pendingCount,
                users = userCount,
                projects = projectCount,
                orders = orderCount,
                parts = partCount,
                suppliers = supplierCount,
            },
            recentProjects,
            recentOrders,
        });
    }

    // ---------- Users ----------

    private static async Task<IResult> ListUsers(AppDbContext db, int page = 1, int pageSize = 50)
    {
        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await db.Users.ToListAsync();
        var rows = all
            .OrderByDescending(u => u.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(u => new
            {
                id = u.Id, name = u.Name, email = u.Email, phone = u.Phone,
                role = u.Role.ToString(), createdAt = u.CreatedAt,
            })
            .ToList();
        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    private static async Task<IResult> ChangeUserRole(AppDbContext db, Guid id, ChangeRoleRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return Results.NotFound(new { message = "کاربر یافت نشد." });
        if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
            return Results.BadRequest(new { message = $"نقش نامعتبر: {req.Role}" });

        user.Role = role;
        await db.SaveChangesAsync();
        return Results.Ok(new { id, role = role.ToString() });
    }

    // ---------- Recipes ----------

    private static async Task<IResult> PendingRecipes(AppDbContext db)
    {
        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var recipes = await db.Recipes
            .Where(r => r.Status == RecipeStatus.UnderReview || r.Status == RecipeStatus.Draft)
            .ToListAsync();

        var result = recipes
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
        {
            id = r.Id, title = r.Title, category = r.Category,
            difficulty = r.Difficulty, safetyLevel = r.SafetyLevel,
            status = r.Status.ToString(), createdAt = r.CreatedAt,
        }).ToList();

        return Results.Ok(new { items = result, total = result.Count });
    }

    private static async Task<IResult> ApproveRecipe(AppDbContext db, string id)
    {
        var recipe = await db.Recipes.Include(r => r.Versions).FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });

        recipe.Status = RecipeStatus.Approved;
        recipe.UpdatedAt = DateTimeOffset.UtcNow;

        var latestVersion = recipe.Versions.MaxBy(v => v.CreatedAt);
        if (latestVersion is not null)
            latestVersion.Status = RecipeStatus.Approved;

        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTimeOffset.UtcNow, EntityType = "Recipe", EntityId = id,
            Action = "Approved", ActorId = "admin",
            DataJson = $"{{\"title\":\"{recipe.Title}\"}}",
        });

        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = "Approved" });
    }

    private static async Task<IResult> RejectRecipe(AppDbContext db, string id)
    {
        var recipe = await db.Recipes.Include(r => r.Versions).FirstOrDefaultAsync(r => r.Id == id);
        if (recipe is null) return Results.NotFound(new { message = "Recipe یافت نشد." });

        recipe.Status = RecipeStatus.Rejected;
        recipe.UpdatedAt = DateTimeOffset.UtcNow;

        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTimeOffset.UtcNow, EntityType = "Recipe", EntityId = id,
            Action = "Rejected", ActorId = "admin",
            DataJson = $"{{\"title\":\"{recipe.Title}\"}}",
        });

        await db.SaveChangesAsync();
        return Results.Ok(new { id, status = "Rejected" });
    }

    // ---------- Orders ----------

    private static async Task<IResult> ListAllOrders(AppDbContext db, int page = 1, int pageSize = 50)
    {
        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await db.Orders.ToListAsync();
        var rows = all
            .OrderByDescending(o => o.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(o => new
            {
                id = o.Id, projectId = o.ProjectId, status = o.Status,
                total = o.Total, recipientName = o.RecipientName,
                createdAt = o.CreatedAt,
            })
            .ToList();
        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    // ---------- Audit Log ----------

    private static async Task<IResult> ListAuditLog(AppDbContext db, int page = 1, int pageSize = 50)
    {
        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await db.AuditLogs.ToListAsync();
        var rows = all
            .OrderByDescending(a => a.Timestamp)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(a => new
            {
                id = a.Id, entityType = a.EntityType, entityId = a.EntityId,
                action = a.Action, actorId = a.ActorId, dataJson = a.DataJson,
                timestamp = a.Timestamp,
            })
            .ToList();
        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }
}
