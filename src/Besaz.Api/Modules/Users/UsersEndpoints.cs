using Besaz.Api.Data;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Users;

/// <summary>
/// مدیریت کاربران — پروفایل، به‌روزرسانی اطلاعات، لیست پروژه‌ها و سفارشات.
/// </summary>
public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/users");

        g.MapGet("/me", GetProfile);
        g.MapPatch("/me", UpdateProfile);
        g.MapGet("/{id:guid}", GetUser);
        g.MapGet("/{id:guid}/projects", GetUserProjects);
        g.MapGet("/{id:guid}/orders", GetUserOrders);

        return app;
    }

    public sealed record UpdateProfileRequest(string? Name, string? Email, string? Phone);

    // ---------- پروفایل کاربر جاری ----------

    private static async Task<IResult> GetProfile(AppDbContext db, HttpRequest http)
    {
        var userId = GetUserId(http);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Results.NotFound(new { message = "کاربر یافت نشد." });

        var projectCount = await db.Projects.CountAsync(p => p.UserId == userId);
        var orderCount = await db.Orders
            .Include(o => o.Items)
            .Where(o => db.Projects.Any(p => p.Id == o.ProjectId && p.UserId == userId))
            .CountAsync();

        return Results.Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            role = user.Role.ToString(),
            createdAt = user.CreatedAt,
            stats = new { projects = projectCount, orders = orderCount },
        });
    }

    // ---------- به‌روزرسانی پروفایل ----------

    private static async Task<IResult> UpdateProfile(AppDbContext db, HttpRequest http, UpdateProfileRequest req)
    {
        var userId = GetUserId(http);
        var user = await db.Users.FindAsync(userId);
        if (user is null) return Results.NotFound(new { message = "کاربر یافت نشد." });

        if (!string.IsNullOrWhiteSpace(req.Name)) user.Name = req.Name;
        if (req.Email is not null) user.Email = req.Email;
        if (req.Phone is not null) user.Phone = req.Phone;

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            role = user.Role.ToString(),
        });
    }

    // ---------- جزئیات کاربر ----------

    private static async Task<IResult> GetUser(AppDbContext db, Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return Results.NotFound(new { message = "کاربر یافت نشد." });

        var projectCount = await db.Projects.CountAsync(p => p.UserId == id);

        return Results.Ok(new
        {
            id = user.Id,
            name = user.Name,
            email = user.Email,
            phone = user.Phone,
            role = user.Role.ToString(),
            createdAt = user.CreatedAt,
            projectCount,
        });
    }

    // ---------- پروژه‌های کاربر ----------

    private static async Task<IResult> GetUserProjects(AppDbContext db, Guid id, int page = 1, int pageSize = 50)
    {
        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await db.Projects
            .Where(p => p.UserId == id)
            .ToListAsync();

        var rows = all
            .OrderByDescending(p => p.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(p => new
            {
                id = p.Id, title = p.Title, recipeId = p.RecipeId,
                status = p.Status.ToString(), createdAt = p.CreatedAt,
            })
            .ToList();

        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    // ---------- سفارشات کاربر ----------

    private static async Task<IResult> GetUserOrders(AppDbContext db, Guid id, int page = 1, int pageSize = 50)
    {
        var projectIds = await db.Projects.Where(p => p.UserId == id).Select(p => p.Id).ToListAsync();

        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await db.Orders
            .Where(o => projectIds.Contains(o.ProjectId))
            .ToListAsync();

        var rows = all
            .OrderByDescending(o => o.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(o => new
            {
                id = o.Id, projectId = o.ProjectId, status = o.Status,
                total = o.Total, itemCount = o.Items.Count, createdAt = o.CreatedAt,
            })
            .ToList();

        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    // ---------- Helper: استخراج User ID از هدر ----------

    private static Guid GetUserId(HttpRequest http)
    {
        if (http.Headers.TryGetValue("X-User-Id", out var header) &&
            Guid.TryParse(header.FirstOrDefault(), out var userId))
            return userId;

        return WellKnownUsers.Guest;
    }
}
