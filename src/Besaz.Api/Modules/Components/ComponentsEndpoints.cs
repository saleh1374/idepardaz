using Besaz.Api.Data;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Components;

/// <summary>کاتالوگ قطعات — بخش۶ سند (Part Master Database).</summary>
public static class ComponentsEndpoints
{
    public static IEndpointRouteBuilder MapComponentsEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/parts")
    {
        var g = app.MapGroup(prefix);
        g.MapGet("/", ListParts);
        g.MapGet("/{id}", GetPart);
        return app;
    }

    private static async Task<IResult> ListParts(AppDbContext db, string? category, string? search, int page = 1, int pageSize = 100)
    {
        IQueryable<LogicalPart> q = db.LogicalParts
            .Include(p => p.SupplierProducts)
            .AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(p => p.Category == category);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search;
            q = q.Where(p => p.NameFa.Contains(s) || p.NameEn.Contains(s) || p.Id.Contains(s));
        }

        var all = await q.OrderBy(p => p.Id).ToListAsync();

        var rows = all
            .Skip(Math.Max(0, page - 1) * pageSize)
            .Take(Math.Clamp(pageSize, 1, 200))
            .Select(p => new
            {
                id = p.Id,
                nameFa = p.NameFa,
                nameEn = p.NameEn,
                category = p.Category,
                unit = p.Unit,
                description = p.Description,
                specCount = p.Specifications.Count,
                minPriceToman = p.SupplierProducts
                    .Where(sp => sp.IsActive && sp.StockStatus == StockStatus.InStock)
                    .Select(sp => (decimal?)sp.Price)
                    .DefaultIfEmpty(null)
                    .Min(),
                supplierCount = p.SupplierProducts.Count(sp => sp.IsActive),
            })
            .ToList();
        return Results.Ok(new { page, pageSize, total = all.Count, items = rows });
    }

    private static async Task<IResult> GetPart(AppDbContext db, string id)
    {
        var part = await db.LogicalParts
            .Include(p => p.Specifications)
            .Include(p => p.SupplierProducts).ThenInclude(sp => sp.Supplier)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);
        if (part is null) return Results.NotFound(new { message = "قطعه یافت نشد." });

        return Results.Ok(new
        {
            id = part.Id,
            nameFa = part.NameFa,
            nameEn = part.NameEn,
            category = part.Category,
            unit = part.Unit,
            description = part.Description,
            specifications = part.Specifications.Select(s => new { key = s.Key, value = s.Value, unit = s.Unit }),
            products = part.SupplierProducts
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    id = p.Id,
                    supplier = p.Supplier?.Name,
                    sku = p.Sku,
                    mpn = p.Mpn,
                    title = p.Title,
                    price = p.Price,
                    stock = p.StockStatus.ToString(),
                    stockQty = p.StockQty,
                    url = p.Url,
                    lastSyncAt = p.LastSyncAt,
                }),
        });
    }
}