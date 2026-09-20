using Besaz.Api.Shared;
using Besaz.Api.Modules.Components;

namespace Besaz.Api.Modules.Suppliers;

/// <summary>فروشگاه/تأمین‌کننده.</summary>
public class Supplier
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string BaseUrl { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<SupplierProduct> Products { get; set; } = new List<SupplierProduct>();
}

/// <summary>
/// محصول یک تأمین‌کننده برای یک LogicalPart — ستون/موتور قیمت زنده و StockStatus.
/// SPU = SKU + MPN + Price + Stock + URL. Sync توسط Job پس‌زمینه (فاز ۳+).
/// </summary>
public class SupplierProduct
{
    public long Id { get; set; }
    public Guid SupplierId { get; set; }
    public string LogicalPartId { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? Mpn { get; set; }
    public string Title { get; set; } = "";
    public decimal Price { get; set; }            // تومان — واحد پول در لایهٔ نمایش
    public StockStatus StockStatus { get; set; } = StockStatus.Unknown;
    public int? StockQty { get; set; }
    public string? Url { get; set; }
    public DateTimeOffset LastSyncAt { get; set; }
    public bool IsActive { get; set; } = true;

    public Supplier? Supplier { get; set; }
    public LogicalPart? LogicalPart { get; set; }
    public ICollection<PriceHistory> PriceHistory { get; set; } = new List<PriceHistory>();
}

/// <summary>تاریخچهٔ قیمت — نمودار قیمت و دادهٔ مذاکره با تأمین‌کننده.</summary>
public class PriceHistory
{
    public long Id { get; set; }
    public long SupplierProductId { get; set; }
    public decimal Price { get; set; }
    public DateTimeOffset CapturedAt { get; set; }
    public string Source { get; set; } = "sync";  // sync / manual / order

    public SupplierProduct? SupplierProduct { get; set; }
}