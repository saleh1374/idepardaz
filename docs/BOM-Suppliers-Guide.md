# راهنمای BOM Engine و تأمین‌کنندگان — MVP

> **نسخه سند:** 1.0 — تاریخ: ۱۴۰۵/۰۷/۰۱

---

## ۱) خلاصهٔ BOM Engine در MVP

### کارهایی که BOM Engine در MVP انجام می‌دهد:
- ✅ محاسبهٔ تعداد قطعات بر اساس پارامترهای کاربر
- ✅ انتخاب بهترین محصول تأمین‌کننده (ارزان‌ترین موجود)
- ✅ نمایش قیمت واقعی از ۳ فروشگاه
- ✅ هشدار در صورت ناموجودبودن قطعه
- ✅ ذخیرهٔ BOM معتبر + snapshot قیمت

### کارهایی که در MVP انجام نمی‌شود:
- ❌ Sync خودکار قیمت (فقط دستی/seed)
- ❌ مقایسهٔ چند فروشگاه در یک نگاه
- ❌ سبد خرید یکپارچه
- ❌ پرداخت آنلاین

---

## ۲) معماری داده

```
LogicalPart (مثلاً «LED سفید ۵mm»)
   ├── SupplierProduct → ECA  (SKU, Price, Stock, URL)
   ├── SupplierProduct → روبوایران
   └── SupplierProduct → کافه‌ربات
```

### موجودیت‌ها:

| موجودیت | توضیح |
|---|---|
| `LogicalPart` | قطعهٔ منطقی (بدون وابستگی به فروشگاه) |
| `SupplierProduct` | محصول واقعی در فروشگاه |
| `PriceHistory` | تاریخچهٔ قیمت |
| `BomRuleDefinition` | قوانین اعتبارسنجی |

---

## ۳) قوانین BOM

| کد | نام | شدت | توضیح |
|---|---|---|---|
| BOM-001 | قطعهٔ الزامی بدون تأمین‌کننده | Error | هر قطعهٔ Required باید حداقل یک SupplierProduct فعال داشته باشد |
| BOM-002 | قطعهٔ انتخاب‌شده ناموجود | Warning | اگر محصول OutOfStock/Unknown باشد هشدار بده |
| BOM-003 | تعداد قطعه باید مثبت باشد | Error | تعداد قلم Required باید > ۰ باشد |
| BOM-004 | جایگزین در دسترس | Info | آگاهی از وجود LogicalPart جایگزین |

---

## ۴) فروشگاه‌های MVP

### ۳ فروشگاه seed:

| فروشگاه | وب‌سایت | تعداد محصول | وضعیت |
|---|---|---|---|
| ECA | eshop.eca.ir | ۸ | ✅ فعال |
| روبوایران | roboiran.com | ۹ | ✅ فعال |
| کافه‌ربات | caferobot.ir | ۸ | ✅ فعال |

---

## ۵) نمونهٔ BOM — چراغ LED USB

### پارامترهای پیش‌فرض:
- رنگ LED: سفید
- کلید قطع/وصل: بله
- تعداد LED: ۱

### BOM خروجی:

| قطعه | تعداد | فروشگاه | قیمت واحد | جمع |
|---|---|---|---|---|
| LED سفید ۵mm | ۱ | ECA | ۸۰۰ تومان | ۸۰۰ تومان |
| مقاومت ۴۷۰ اهم | ۱ | ECA | ۲۰۰ تومان | ۲۰۰ تومان |
| کابل USB-A | ۱ | ECA | ۴۵,۰۰۰ تومان | ۴۵,۰۰۰ تومان |
| کلید SPDT | ۱ | ECA | ۲۰,۰۰۰ تومان | ۲۰,۰۰۰ تومان |
| **جمع کل** | | | | **۶۶,۰۰۰ تومان** |

### لینک‌های خرید:
- LED: https://eshop.eca.ir/product/led-s5-w
- مقاومت: https://eshop.eca.ir/product/res-470
- کابل USB: https://eshop.eca.ir/product/usb-cable-a
- کلید: https://eshop.eca.ir/product/sw-spdt

---

## ۶) نمونهٔ BOM — فن خنک‌کننده USB

### پارامترهای پیش‌فرض:
- سرعت فن: متوسط
- کلید قطع/وصل: بله

### BOM خروجی:

| قطعه | تعداد | فروشگاه | قیمت واحد | جمع |
|---|---|---|---|---|
| موتور فن DC ۵V | ۱ | روبوایران | ۸۰,۰۰۰ تومان | ۸۰,۰۰۰ تومان |
| کابل USB-A | ۱ | ECA | ۴۵,۰۰۰ تومان | ۴۵,۰۰۰ تومان |
| کلید SPDT | ۱ | ECA | ۲۰,۰۰۰ تومان | ۲۰,۰۰۰ تومان |
| قاب پلاستیکی | ۱ | روبوایران | ۱۵,۰۰۰ تومان | ۱۵,۰۰۰ تومان |
| سیم ۲۲AWG | ۲ متر | روبوایران | ۱۵,۰۰۰ تومان | ۳۰,۰۰۰ تومان |
| **جمع کل** | | | | **۱۹۰,۰۰۰ تومان** |

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

### فیلدهای لازم در UI:

```
آخرین به‌روزرسانی: ۱۴۰۵/۰۷/۰۱ — ۱۲:۳۰
⚠️ قیمت‌ها تقریبی هستند و ممکن است تغییر کنند
```

---

## ۸) Admin UI پیشنهادی (متنی)

### صفحهٔ مدیریت LogicalPart:

```
مدیریت قطعات

[+ قطعهٔ جدید]

شناسه | نام فارسی | نام انگلیسی | دسته | واحد | وضعیت
LED-5MM-WHITE | LED سفید ۵mm | LED 5mm White | led | عدد | ✅
RES-470 | مقاومت ۴۷۰ اهم | Resistor 470Ω | resistor | عدد | ✅
USB-A-CABLE | کابل USB-A | USB-A Cable | cable | عدد | ✅

[ویرایش] [حذف]
```

### صفحهٔ مدیریت SupplierProduct:

```
مدیریت محصولات تأمین‌کنندگان

[+ محصول جدید]

قطعه | فروشگاه | SKU | قیمت | موجودی | وضعیت | آخرین به‌روزرسانی
LED-5MM-WHITE | ECA | LED-S5-W | ۸۰۰ | ۸۰۰ | ✅ موجود | ۱۴۰۵/۰۷/۰۱
LED-5MM-WHITE | روبوایران | LEDWHT5 | ۹۰۰ | ۳۰۰ | ✅ موجود | ۱۴۰۵/۰۷/۰۱
LED-5MM-WHITE | کافه‌ربات | LED5WH | ۸۵۰ | ۱۲ | ⚠️ کم | ۱۴۰۵/۰۷/۰۱

[ویرایش] [حذف] [تاریخچهٔ قیمت]
```

---

## ۹) نکات فنی مهم

### ۱. قیمت در OrderItem همیشه snapshot:

```csharp
// قیمت لحظهٔ ثبت سفارش جدا از قیمت جاری ذخیره می‌شود
orderItem.Price = supplierProduct.Price; // snapshot
```

### ۲. BOM نامعتبر ذخیره نمی‌شود:

```csharp
if (!computation.IsValid)
    return ErrorResult(request, computation.Errors.ToArray());
```

### ۳. انتخاب بهترین محصول:

```csharp
// ساده: ارزان‌ترین موجود
var inStock = candidates.Where(c => c.StockStatus == StockStatus.InStock);
var chosen = inStock.OrderBy(c => c.Price).First();
```

### ۴. فرمول‌های پارامتری:

```json
{
  "key": "ledCount",
  "type": "integer",
  "affects": [
    { "logicalPartId": "LED-5MM-WHITE", "expression": "ledCount" },
    { "logicalPartId": "RES-470", "expression": "ledCount" }
  ]
}
```

---

## ۱۰) نقشهٔ راه BOM

| فاز | قابلیت | وضعیت |
|---|---|---|
| MVP | Seed دستی + محاسبهٔ ساده | ✅ انجام شده |
| فاز ۱ | اسکریپت Scraping ساده | آینده |
| فاز ۲ | مقایسهٔ چند فروشگاه | آینده |
| فاز ۳ | سبد خرید یکپارچه | آینده |
| فاز ۴ | پرداخت آنلاین | آینده |
| فاز ۵ | Sync خودکار + API فروشگاه‌ها | آینده |
