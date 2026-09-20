using Besaz.Api.Data;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Suppliers;

/// <summary>Supplier Engine — قیمت/موجودی زنده و همگام‌سازی (فاز ۳: Job پس‌زمینه).</summary>
public static class SuppliersEndpoints
{
    public static IEndpointRouteBuilder MapSuppliersEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/suppliers")
    {
        var g = app.MapGroup(prefix);
        g.MapGet("/", List);
        g.MapGet("/{id:guid}", Get);
        g.MapGet("/{id:guid}/products", GetProducts);
        g.MapPost("/{id:guid}/sync", Sync);   // شبیه‌سازی Job همگام‌سازی (Hangfire در فاز ۳+)
        return app;
    }

    public sealed record SyncItem(string LogicalPartId, string Sku, string? Mpn, string Title, decimal Price, StockStatus Stock, int? StockQty, string? Url);

    private static async Task<IResult> List(AppDbContext db)
    {
        var rows = await db.Suppliers.AsNoTracking()
            .Select(s => new
            {
                id = s.Id,
                name = s.Name,
                baseUrl = s.BaseUrl,
                productCount = s.Products.Count(p => p.IsActive),
            })
            .OrderBy(x => x.name)
            .ToListAsync();
        return Results.Ok(new { items = rows });
    }

    private static async Task<IResult> Get(AppDbContext db, Guid id)
    {
        var s = await db.Suppliers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return s is null ? Results.NotFound(new { message = "تأمین‌کننده یافت نشد." }) : Results.Ok(s);
    }

    private static async Task<IResult> GetProducts(AppDbContext db, Guid id)
    {
        var rows = await db.SupplierProducts.AsNoTracking()
            .Where(p => p.SupplierId == id && p.IsActive)
            .Select(p => new
            {
                id = p.Id,
                logicalPartId = p.LogicalPartId,
                sku = p.Sku,
                mpn = p.Mpn,
                title = p.Title,
                price = p.Price,
                stock = p.StockStatus.ToString(),
                stockQty = p.StockQty,
                url = p.Url,
                lastSyncAt = p.LastSyncAt,
            })
            .ToListAsync();
        return Results.Ok(new { items = rows });
    }

    /// <summary>به‌روزرسانی دسته‌ای قیمت/موجودی + ثبت PriceHistory و LastSyncAt.</summary>
    private static async Task<IResult> Sync(AppDbContext db, Guid id, SyncItem[] items)
    {
        if (items.Length == 0) return Results.BadRequest(new { message = "هیچ موردی برای همگام‌سازی ارسال نشده است." });
        var supplier = await db.Suppliers.FirstOrDefaultAsync(s => s.Id == id);
        if (supplier is null) return Results.NotFound(new { message = "تأمین‌کننده یافت نشد." });

        var now = DateTimeOffset.UtcNow;
        var changed = 0;
        foreach (var item in items)
        {
            var existing = await db.SupplierProducts.FirstOrDefaultAsync(p => p.SupplierId == id && p.Sku == item.Sku);
            if (existing is null)
            {
                existing = new SupplierProduct
                {
                    SupplierId = id,
                    LogicalPartId = item.LogicalPartId,
                    Sku = item.Sku,
                    Mpn = item.Mpn,
                    Title = item.Title,
                    Price = item.Price,
                    StockStatus = item.Stock,
                    StockQty = item.StockQty,
                    Url = item.Url,
                    LastSyncAt = now,
                };
                db.SupplierProducts.Add(existing);
            }
            else
            {
                if (existing.Price != item.Price)
                {
                    db.PriceHistories.Add(new PriceHistory
                    {
                        SupplierProductId = existing.Id,
                        Price = item.Price,
                        CapturedAt = now,
                        Source = "sync",
                    });
                }
                existing.Price = item.Price;
                existing.StockStatus = item.Stock;
                existing.StockQty = item.StockQty;
                existing.Url = item.Url;
                existing.LastSyncAt = now;
            }
            changed++;
        }
        await db.SaveChangesAsync();
        return Results.Ok(new { supplierId = id, changed, syncedAt = now });
    }
}