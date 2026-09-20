using Besaz.Api.Data;
using Besaz.Api.Http;
using Besaz.Api.Modules.Projects;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Orders;

/// <summary>
/// سفارش قطعات — فاز دو سند. قیمت‌ها همیشه snapshot هستند (کش و تورم ایران).
/// درگاه پشت IPaymentGateway قرار دارد (ZarinPal — Integration Pending).
/// </summary>
public static class OrdersEndpoints
{
    public static IEndpointRouteBuilder MapOrdersEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/orders")
    {
        var g = app.MapGroup(prefix);
        g.MapPost("/", CreateFromProject);
        g.MapGet("/{id:long}", Get);
        return app;
    }

    public sealed record CreateOrderRequest(long ProjectId, string? RecipientName, string? ShippingAddress);

    private static async Task<IResult> CreateFromProject(AppDbContext db, CreateOrderRequest req, HttpRequest http)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == req.ProjectId);
        if (project is null) return Results.NotFound(new { message = "پروژه یافت نشد." });

        var bom = await db.Boms.Include(b => b.Items).AsNoTracking().FirstOrDefaultAsync(b => b.Id == project.BomId);
        if (bom is null || !bom.IsValid)
            return Results.BadRequest(new { message = "BOM معتبر برای این پروژه وجود ندارد. ابتدا BOM را بسازید." });

        var orderItems = bom.Items
            .Where(i => i.SupplierProductId.HasValue)
            .Select(i => new OrderItem
            {
                LogicalPartId = i.LogicalPartId,
                LogicalPartName = i.LogicalPartName,
                Sku = i.Sku,
                SupplierName = i.SupplierName,
                Url = i.Url,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice ?? 0,
                LineTotal = i.LineTotal ?? 0,
            })
            .ToList();

        var order = new Order
        {
            ProjectId = project.Id,
            RecipientName = req.RecipientName,
            ShippingAddress = req.ShippingAddress,
            Status = "Pending",
            Total = orderItems.Sum(i => i.LineTotal),
            CreatedAt = DateTimeOffset.UtcNow,
            Items = orderItems,
        };
        db.Orders.Add(order);

        // Payment — درگاه واقعی (ZarinPal/IDPay) در فاز دو متصل می‌شود
        var payment = new Payment
        {
            OrderId = order.Id,
            Gateway = "ZarinPal",
            Status = "Pending",
            Amount = order.Total,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Payments.Add(payment);

        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTimeOffset.UtcNow,
            EntityType = "Order",
            EntityId = order.Id.ToString(),
            Action = "Created",
            ActorId = project.UserId.ToString(),
            DataJson = System.Text.Json.JsonSerializer.Serialize(new { total = order.Total }),
        });

        if (project.Status < ProjectStatus.Ordered)
            project.Status = ProjectStatus.Ordered;

        await db.SaveChangesAsync();

        return Results.Created($"/api/orders/{order.Id}", new
        {
            order = new
            {
                id = order.Id,
                projectId = order.ProjectId,
                status = order.Status,
                total = order.Total,
                createdAt = order.CreatedAt,
                items = order.Items.Select(i => new
                {
                    i.LogicalPartId, i.LogicalPartName, i.Sku, i.SupplierName, i.Quantity, i.UnitPrice, i.LineTotal, i.Url,
                }),
            },
            payment = new
            {
                id = payment.Id,
                gateway = payment.Gateway,
                status = payment.Status,
                amount = payment.Amount,
                note = "اتصال درگاه واقعی Integration Pending است — در فاز دو ZarinPal/IDPay متصل می‌شود.",
            },
        });
    }

    private static async Task<IResult> Get(AppDbContext db, long id)
    {
        var order = await db.Orders.Include(o => o.Items).AsNoTracking().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return Results.NotFound(new { message = "سفارش یافت نشد." });
        return Results.Ok(new
        {
            id = order.Id,
            projectId = order.ProjectId,
            status = order.Status,
            total = order.Total,
            recipientName = order.RecipientName,
            shippingAddress = order.ShippingAddress,
            createdAt = order.CreatedAt,
            items = order.Items.Select(i => new
            {
                i.LogicalPartId, i.LogicalPartName, i.Sku, i.SupplierName, i.Quantity, i.UnitPrice, i.LineTotal, i.Url,
            }),
        });
    }
}