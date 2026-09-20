using Besaz.Api.Data;
using Besaz.Api.Modules.Users;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Makers;

/// <summary>
/// پنل صنعتگران — فهرست، پروفایل، خدمات، درخواست نقل‌قول.
/// </summary>
public static class MakerEndpoints
{
    public static IEndpointRouteBuilder MapMakerEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/makers");

        // فهرست صنعتگران
        g.MapGet("/", ListMakers);
        g.MapGet("/{id:guid}", GetMaker);
        g.MapGet("/{id:guid}/services", GetMakerServices);

        // درخواست نقل‌قول
        g.MapPost("/quote", RequestQuote);
        g.MapGet("/quotes", ListQuotes);
        g.MapPatch("/quotes/{id:long}/respond", RespondToQuote);

        return app;
    }

    public sealed record RequestQuoteRequest(
        Guid MakerId,
        long? ProjectId,
        string Description
    );

    public sealed record RespondQuoteRequest(
        decimal Price,
        string? Notes
    );

    // ---------- فهرست صنعتگران ----------

    private static async Task<IResult> ListMakers(AppDbContext db, string? city, string? specialty, int page = 1, int pageSize = 50)
    {
        var query = db.Makers.Where(m => m.IsActive).AsQueryable();

        if (!string.IsNullOrWhiteSpace(city))
            query = query.Where(m => m.City == city);

        // فیلتر تخصص — SQLite: در JSON string جستجو
        if (!string.IsNullOrWhiteSpace(specialty))
            query = query.Where(m => m.Specialties != null && m.Specialties.Contains(specialty));

        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await query.Include(m => m.Services).ToListAsync();

        var rows = all
            .OrderByDescending(m => m.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(m => new
            {
                id = m.Id,
                displayName = m.DisplayName,
                bio = m.Bio,
                specialties = m.Specialties,
                city = m.City,
                avatarUrl = m.AvatarUrl,
                isVerified = m.IsVerified,
                rating = m.RatingCount > 0 ? (double)m.RatingSum / m.RatingCount : 0,
                ratingCount = m.RatingCount,
                serviceCount = m.Services.Count(s => s.IsActive),
                createdAt = m.CreatedAt,
            })
            .ToList();

        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    // ---------- پروفایل صنعتگر ----------

    private static async Task<IResult> GetMaker(AppDbContext db, Guid id)
    {
        var maker = await db.Makers
            .Include(m => m.User)
            .Include(m => m.Services)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (maker is null) return Results.NotFound(new { message = "صنعتگر یافت نشد." });

        return Results.Ok(new
        {
            id = maker.Id,
            displayName = maker.DisplayName,
            bio = maker.Bio,
            specialties = maker.Specialties,
            city = maker.City,
            avatarUrl = maker.AvatarUrl,
            isVerified = maker.IsVerified,
            rating = maker.RatingCount > 0 ? (double)maker.RatingSum / maker.RatingCount : 0,
            ratingCount = maker.RatingCount,
            userName = maker.User.Name,
            createdAt = maker.CreatedAt,
            services = maker.Services.Where(s => s.IsActive).Select(s => new
            {
                id = s.Id,
                title = s.Title,
                description = s.Description,
                price = s.Price,
                unit = s.Unit,
                leadTimeDays = s.LeadTimeDays,
            }),
        });
    }

    // ---------- خدمات صنعتگر ----------

    private static async Task<IResult> GetMakerServices(AppDbContext db, Guid id)
    {
        var maker = await db.Makers.FindAsync(id);
        if (maker is null) return Results.NotFound(new { message = "صنعتگر یافت نشد." });

        var services = await db.MakerServices
            .Where(s => s.MakerId == id && s.IsActive)
            .OrderBy(s => s.Title)
            .ToListAsync();

        return Results.Ok(new
        {
            makerId = id,
            makerName = maker.DisplayName,
            items = services.Select(s => new
            {
                id = s.Id,
                title = s.Title,
                description = s.Description,
                price = s.Price,
                unit = s.Unit,
                leadTimeDays = s.LeadTimeDays,
            }),
        });
    }

    // ---------- درخواست نقل‌قول ----------

    private static async Task<IResult> RequestQuote(AppDbContext db, RequestQuoteRequest req)
    {
        var maker = await db.Makers.FindAsync(req.MakerId);
        if (maker is null) return Results.NotFound(new { message = "صنعتگر یافت نشد." });

        var quote = new QuoteRequest
        {
            MakerId = req.MakerId,
            ProjectId = req.ProjectId,
            RequesterId = WellKnownUsers.Guest, // MVP: هدر X-User-Id
            Description = req.Description,
            Status = "Pending",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.QuoteRequests.Add(quote);
        await db.SaveChangesAsync();

        return Results.Created($"/api/makers/quotes/{quote.Id}", new
        {
            id = quote.Id,
            makerId = quote.MakerId,
            status = quote.Status,
            createdAt = quote.CreatedAt,
        });
    }

    // ---------- فهرست نقل‌قول‌ها ----------

    private static async Task<IResult> ListQuotes(AppDbContext db, string? status, int page = 1, int pageSize = 50)
    {
        var query = db.QuoteRequests.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(q => q.Status == status);

        // SQLite: DateTimeOffset.OrderBy unsupported — ToListAsync first
        var all = await query.ToListAsync();

        var rows = all
            .OrderByDescending(q => q.CreatedAt)
            .Skip((Math.Max(1, page) - 1) * pageSize).Take(Math.Clamp(pageSize, 1, 200))
            .Select(q => new
            {
                id = q.Id,
                makerId = q.MakerId,
                projectId = q.ProjectId,
                description = q.Description,
                status = q.Status,
                quotedPrice = q.QuotedPrice,
                notes = q.Notes,
                createdAt = q.CreatedAt,
                respondedAt = q.RespondedAt,
            })
            .ToList();

        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    // ---------- پاسخ صنعتگر به نقل‌قول ----------

    private static async Task<IResult> RespondToQuote(AppDbContext db, long id, RespondQuoteRequest req)
    {
        var quote = await db.QuoteRequests.FindAsync(id);
        if (quote is null) return Results.NotFound(new { message = "درخواست نقل‌قول یافت نشد." });
        if (quote.Status != "Pending")
            return Results.BadRequest(new { message = "این درخواست قبلاً پاسخ داده شده." });

        quote.Status = "Quoted";
        quote.QuotedPrice = req.Price;
        quote.Notes = req.Notes;
        quote.RespondedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        return Results.Ok(new
        {
            id = quote.Id,
            status = quote.Status,
            quotedPrice = quote.QuotedPrice,
            respondedAt = quote.RespondedAt,
        });
    }
}
