# ماژول Suppliers — بساز

> **نسخه:** MVP — مدیریت تأمین‌کنندگان و محصولات

---

## ۱) خلاصه

ماژول Suppliers مسئول مدیریت فروشگاه‌ها و محصولات آنها است:
- **مدیریت فروشگاه‌ها:** ECA، روبوایران، کافه‌ربات
- **مدیریت محصولات:** SKU، قیمت، موجودی
- **تاریخچهٔ قیمت:** PriceHistory برای نمودار و مذاکره
- **آینده:** Sync خودکار قیمت

---

## ۲) معماری داده

```
Supplier (فروشگاه)
   └── SupplierProduct (محصول)
         ├── LogicalPart (قطعهٔ منطقی)
         └── PriceHistory (تاریخچهٔ قیمت)
```

---

## ۳) موجودیت‌ها

### Supplier:

```csharp
public class Supplier
{
    public Guid Id { get; set; }
    public string Name { get; set; }        // "ECA"
    public string BaseUrl { get; set; }     // "https://eshop.eca.ir"
    public bool IsActive { get; set; }      // true
    public DateTimeOffset CreatedAt { get; set; }
}
```

### SupplierProduct:

```csharp
public class SupplierProduct
{
    public long Id { get; set; }
    public Guid SupplierId { get; set; }
    public string LogicalPartId { get; set; } // "LED-5MM-WHITE"
    public string Sku { get; set; }          // "LED-S5-W"
    public string? Mpn { get; set; }         // "LED-5W"
    public string Title { get; set; }        // "LED سفید ۵mm — ECA"
    public decimal Price { get; set; }       // 800 (تومان)
    public StockStatus StockStatus { get; set; } // InStock
    public int? StockQty { get; set; }       // 800
    public string? Url { get; set; }         // "https://..."
    public DateTimeOffset LastSyncAt { get; set; }
    public bool IsActive { get; set; }
}
```

### PriceHistory:

```csharp
public class PriceHistory
{
    public long Id { get; set; }
    public long SupplierProductId { get; set; }
    public decimal Price { get; set; }       // 800 (تومان)
    public DateTimeOffset CapturedAt { get; set; }
    public string Source { get; set; }       // "sync" / "manual" / "order"
}
```

---

## ۴) وضعیت موجودی

| وضعیت | توضیح | نماد |
|---|---|---|
| `InStock` | موجود | ✅ |
| `LowStock` | کم | ⚠️ |
| `OutOfStock` | ناموجود | ❌ |
| `Unknown` | نامشخص | ❓ |

---

## ۵) فروشگاه‌های MVP

| فروشگاه | وب‌سایت | تعداد محصول | وضعیت |
|---|---|---|---|
| ECA | eshop.eca.ir | ۸ | ✅ فعال |
| روبوایران | roboiran.com | ۹ | ✅ فعال |
| کافه‌ربات | caferobot.ir | ۸ | ✅ فعال |

---

## ۶) API Endpoints

### دریافت لیست فروشگاه‌ها:

```
GET /api/suppliers
```

### پاسخ:

```json
{
  "items": [
    {
      "id": "guid-1",
      "name": "ECA",
      "baseUrl": "https://eshop.eca.ir",
      "productCount": 8
    },
    {
      "id": "guid-2",
      "name": "روبوایران",
      "baseUrl": "https://roboiran.com",
      "productCount": 9
    },
    {
      "id": "guid-3",
      "name": "کافه‌ربات",
      "baseUrl": "https://caferobot.ir",
      "productCount": 8
    }
  ]
}
```

---

## ۷) استراتژی Sync قیمت در MVP

### روش فعلی: Seed دستی

```csharp
// در SeedData.cs
part("LED-5MM-WHITE", "LED سفید ۵ میلی‌متر", ...
    [
        (eca, "LED-S5-W", null, 800, StockStatus.InStock, 800, "..."),
        (robo, "LEDWHT5", "LED-5W", 900, StockStatus.InStock, 300, "..."),
    ]);
```

### روش آینده: Scraping ساده

```csharp
// اسکریپت ساده برای به‌روزرسانی قیمت
public class PriceSyncService
{
    public async Task SyncPricesAsync()
    {
        var suppliers = await _db.Suppliers.Where(s => s.IsActive).ToListAsync();
        foreach (var supplier in suppliers)
        {
            var prices = await ScrapePricesAsync(supplier.BaseUrl);
            foreach (var (sku, price, stock) in prices)
            {
                var product = await _db.SupplierProducts
                    .FirstOrDefaultAsync(p => p.SupplierId == supplier.Id && p.Sku == sku);
                if (product is not null)
                {
                    product.Price = price;
                    product.StockStatus = stock;
                    product.LastSyncAt = DateTimeOffset.UtcNow;
                }
            }
        }
        await _db.SaveChangesAsync();
    }
}
```

---

## ۸) نکات فنی مهم

### ۱. قیمت در OrderItem همیشه snapshot:

```csharp
// قیمت لحظهٔ ثبت سفارش جدا از قیمت جاری ذخیره می‌شود
orderItem.Price = supplierProduct.Price; // snapshot
```

### ۲. انتخاب بهترین محصول:

```csharp
// ساده: ارزان‌ترین موجود
var inStock = candidates.Where(c => c.StockStatus == StockStatus.InStock);
var chosen = inStock.OrderBy(c => c.Price).First();
```

### ۳. PriceHistory برای نمودار:

```csharp
// دریافت تاریخچهٔ قیمت برای نمودار
var history = await _db.PriceHistory
    .Where(p => p.SupplierProductId == productId)
    .OrderByDescending(p => p.CapturedAt)
    .ToListAsync();
```

---

## ۹) نقشهٔ راه Suppliers

| فاز | قابلیت | وضعیت |
|---|---|---|
| MVP | Seed دستی + ۳ فروشگاه | ✅ انجام شده |
| فاز ۱ | اسکریپت Scraping ساده | آینده |
| فاز ۲ | مقایسهٔ چند فروشگاه | آینده |
| فاز ۳ | API فروشگاه‌ها | آینده |
| فاز ۴ | Sync خودکار | آینده |
