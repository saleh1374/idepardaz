# ماژول BOM — بساز

> **نسخه:** MVP — محاسبهٔ BOM واقعی با قیمت فروشگاه‌های ایرانی

---

## ۱) خلاصه

ماژول BOM مسئول تولید لیست قطعات (Bill of Materials) برای هر Recipe است:
- **محاسبهٔ تعداد** قطعات بر اساس پارامترهای کاربر
- **انتخاب بهترین محصول** تأمین‌کننده (ارزان‌ترین موجود)
- **نمایش قیمت واقعی** از ۳ فروشگاه
- **هشدار** در صورت ناموجودبودن قطعه
- **ذخیرهٔ BOM معتبر** + snapshot قیمت

---

## ۲) معماری

```
RecipeVersion + Parameters
         ↓
    BomCalculator (خالص — بدون DB)
         ↓
    BomEngine (هماهنگ‌کننده — با DB)
         ↓
    BOM معتبر + snapshot قیمت
```

---

## ۳) BomCalculator — محاسبهٔ خالص

### ورودی:
- `RecipePayload` (نسخهٔ قفل‌شده)
- `Parameters` (پارامترهای کاربر)
- `LogicalParts` (کاتالوگ قطعات)
- `SupplierProducts` (محصولات تأمین‌کنندگان)
- `BomRuleDefinitions` (قوانین)

### خروجی:
- `IsValid` (آیا BOM معتبر است؟)
- `Errors` (خطاها)
- `Warnings` (هشدارها)
- `Lines` (قلم‌های BOM)
- `Total` (جمع کل)

### الگوریتم:

```csharp
// ۱) اعتبارسنجی ساختاری
var structural = RecipeValidator.Validate(payload);

// ۲) پارامترهای مؤثر
var effective = ResolveParameters(payload, rawParameters, errors);

// ۳) ساخت قلم‌ها
foreach (var component in payload.ComponentsList)
{
    // محاسبهٔ تعداد
    var qty = ExpressionEvaluator.EvaluateNumber(component.QtyFormula, variables);
    
    // انتخاب بهترین محصول
    var pick = candidates.OrderBy(c => c.Price).First();
    
    // ساخت قلم BOM
    lines.Add(new BomLine(...));
}

// ۴) اجرای قوانین
foreach (var rule in rules)
    EvaluateRule(rule, lines, errors, warnings);

// ۵) جمع کل
var total = lines.Where(l => l.UnitPrice.HasValue).Sum(l => l.LineTotal ?? 0);
```

---

## ۴) قوانین BOM

| کد | نام | شدت | توضیح |
|---|---|---|---|
| BOM-001 | قطعهٔ الزامی بدون تأمین‌کننده | Error | هر قطعهٔ Required باید حداقل یک SupplierProduct فعال داشته باشد |
| BOM-002 | قطعهٔ انتخاب‌شده ناموجود | Warning | اگر محصول OutOfStock/Unknown باشد هشدار بده |
| BOM-003 | تعداد قطعه باید مثبت باشد | Error | تعداد قلم Required باید > ۰ باشد |
| BOM-004 | جایگزین در دسترس | Info | آگاهی از وجود LogicalPart جایگزین |

---

## ۵) نمونه BOM — چراغ LED USB

### پارامترها:
- ledColor: white
- includeSwitch: true
- ledCount: 1

### خروجی:

```json
{
  "isValid": true,
  "errors": [],
  "warnings": [],
  "bomId": 1,
  "total": 66000,
  "recipeTitle": "چراغ LED USB",
  "recipeVersion": "1.0.0",
  "items": [
    {
      "logicalPartId": "LED-5MM-WHITE",
      "logicalPartName": "LED سفید ۵ میلی‌متر",
      "role": "Required",
      "quantity": 1,
      "supplierProductId": 1,
      "supplierName": "ECA",
      "sku": "LED-S5-W",
      "unitPrice": 800,
      "lineTotal": 800,
      "stockStatus": "InStock",
      "url": "https://eshop.eca.ir/product/led-s5-w",
      "notes": "برای رنگ‌های مختلف، شناسهٔ LogicalPart متناظر جایگزین می‌شود."
    },
    {
      "logicalPartId": "RES-470",
      "logicalPartName": "مقاومت ۴۷۰ اهم ۱/۴ وات",
      "role": "Required",
      "quantity": 1,
      "supplierProductId": 4,
      "supplierName": "ECA",
      "sku": "RES-470R",
      "unitPrice": 200,
      "lineTotal": 200,
      "stockStatus": "InStock",
      "url": "https://eshop.eca.ir/product/res-470",
      "notes": "برای ۵ ولت و LED معمولی، ۴۷۰ اهم هر LED را زیر جریان ایمن نگه می‌دارد."
    },
    {
      "logicalPartId": "USB-A-CABLE",
      "logicalPartName": "کابل USB-A (تغذیهٔ ۵ ولت)",
      "role": "Required",
      "quantity": 1,
      "supplierProductId": 7,
      "supplierName": "ECA",
      "sku": "USB-CB-A1",
      "unitPrice": 45000,
      "lineTotal": 45000,
      "stockStatus": "InStock",
      "url": "https://eshop.eca.ir/product/usb-cable-a",
      "notes": "کابل USB که بتوان سرش را باز کرد یا کانکتور آداپتور دارد."
    },
    {
      "logicalPartId": "SWITCH-SPDT",
      "logicalPartName": "کلید قطع/وصل SPDT",
      "role": "Optional",
      "quantity": 1,
      "supplierProductId": 9,
      "supplierName": "ECA",
      "sku": "SW-SPDT",
      "unitPrice": 20000,
      "lineTotal": 20000,
      "stockStatus": "InStock",
      "url": "https://eshop.eca.ir/product/sw-spdt",
      "notes": null
    }
  ]
}
```

---

## ۶) API Endpoints

### تولید BOM:

```
POST /api/bom/generate

{
  "recipeId": "RLED-001",
  "parameters": {
    "ledColor": "white",
    "includeSwitch": true,
    "ledCount": 1
  }
}
```

### دریافت BOM:

```
GET /api/bom/{id}
```

---

## ۷) نکات فنی مهم

### ۱. BOM نامعتبر ذخیره نمی‌شود:

```csharp
if (!computation.IsValid)
    return ErrorResult(request, computation.Errors.ToArray());
```

### ۲. انتخاب بهترین محصول:

```csharp
// ساده: ارزان‌ترین موجود
var inStock = candidates.Where(c => c.StockStatus == StockStatus.InStock);
var chosen = inStock.OrderBy(c => c.Price).First();
```

### ۳. فرمول‌های پارامتری:

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

### ۴. قیمت در OrderItem همیشه snapshot:

```csharp
// قیمت لحظهٔ ثبت سفارش جدا از قیمت جاری ذخیره می‌شود
orderItem.Price = supplierProduct.Price; // snapshot
```

---

## ۸) نقشهٔ راه BOM

| فاز | قابلیت | وضعیت |
|---|---|---|
| MVP | Seed دستی + محاسبهٔ ساده | ✅ انجام شده |
| فاز ۱ | اسکریپت Scraping ساده | آینده |
| فاز ۲ | مقایسهٔ چند فروشگاه | آینده |
| فاز ۳ | سبد خرید یکپارچه | آینده |
| فاز ۴ | پرداخت آنلاین | آینده |
| فاز ۵ | Sync خودکار + API فروشگاه‌ها | آینده |
