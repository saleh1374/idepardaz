using Besaz.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Safety;

/// <summary>خواندن لاگ حساس (AuditLog) — ستون فقرات Safety Gate و سندیت.</summary>
public static class SafetyEndpoints
{
    public static IEndpointRouteBuilder MapSafetyEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/audit")
    {
        var g = app.MapGroup(prefix);
        g.MapGet("/", List);
        return app;
    }

    private static async Task<IResult> List(AppDbContext db, string? entityType, string? entityId, int page = 1, int pageSize = 100)
    {
        IQueryable<AuditLog> q = db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(l => l.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(entityId)) q = q.Where(l => l.EntityId == entityId);

        var all = (await q.ToListAsync())
            .OrderByDescending(l => l.Timestamp).ToList();
        var rows = all
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(l => new
            {
                l.Id, l.Timestamp, l.EntityType, l.EntityId, l.Action, l.ActorId, l.DataJson,
            })
            .ToList();
        return Results.Ok(new { page, pageSize, items = rows });
    }
}