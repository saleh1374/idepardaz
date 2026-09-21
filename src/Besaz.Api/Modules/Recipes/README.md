# ماژول Recipes — بساز

> **نسخه:** MVP — نسخه‌بندی، وضعیت‌ها و قانون ۳ تأیید

---

## ۱) خلاصه

ماژول Recipes مسئول مدیریت چرخهٔ حیات Recipeها است:
- **نسخه‌بندی:** هر تغییر = نسخهٔ جدید (غیرقابل تغییر)
- **وضعیت‌ها:** Draft → UnderReview → Approved → Deprecated → Archived
- **قانون ۳:** سطح HIGH/CRITICAL نیاز به ۲ بازبین دارد
- **امنیت:** RecipeVersion هرگز تغییر نمی‌کند

---

## ۲) وضعیت‌ها و چرخهٔ حیات

```
Draft → UnderReview → Approved ─┬→ Deprecated → Archived
                        └→ Rejected → Draft (بازگشت با نظرات)
```

| وضعیت | توضیح | اجازه‌ها |
|---|---|---|
| `Draft` | در حال ویرایش | ویرایش، حذف |
| `UnderReview` | در انتظار بازبینی | فقط مشاهده |
| `Approved` | تأیید شده | استفاده در BOM، نمایش عمومی |
| `Rejected` | رد شده | بازگشت به Draft |
| `Deprecated` | منسوخ | فقط مشاهده |
| `Archived` | بایگانی | فقط مشاهده |

---

## ۳) قانون ۳ تأیید

### سطح LOW/MEDIUM:
- **۱ بازبین فنی** کافی است
- مثال: چراغ LED USB، فن USB، تستر باتری

### سطح HIGH/CRITICAL:
- **۲ بازبین** لازم است:
  1. بازبین فنی
  2. بازبین ایمنی
- مثال: پاوربانک USB-C

### پیاده‌سازی در SeedData:

```csharp
// قانون ۳: سطح HIGH/CRITICAL هر دو بازبین (فنی + ایمنی) را می‌خواهد
if (payload.SafetyLevel is SafetyLevel.High or SafetyLevel.Critical)
{
    approvals.Add(new SafetyApproval { Role = "technical", Verdict = "Approved" });
    approvals.Add(new SafetyApproval { Role = "safety", Verdict = "Approved" });
}
else
{
    approvals.Add(new SafetyApproval { Role = "technical", Verdict = "Approved" });
}
```

---

## ۴) نسخه‌بندی (Semantic Versioning)

### فرمت: `MAJOR.MINOR.PATCH`

| نوع | مثال | دلیل |
|---|---|---|
| MAJOR | `2.0.0` | تغییر ساختاری بزرگ |
| MINOR | `1.1.0` | اضافه‌شدن قطعه یا گام جدید |
| PATCH | `1.0.1` | اصلاح متن یا فرمول |

### نمونه:

```json
{
  "version": "1.0.0",
  "changelog": ["نسخهٔ اولیه — تأیید تیم بساز"]
}
```

---

## ۵) RecipeVersion غیرقابل تغییر (Immutable)

### قانون ۱:
> هیچ Recipe بدون نسخه ذخیره نمی‌شود. RecipeVersion **غیرقابل تغییر** است.

### قانون ۲:
> هر Project به یک RecipeVersion دقیق lock می‌شود (`PB-001@1.2.0`).

### پیاده‌سازی:

```csharp
public class RecipeVersion
{
    public long Id { get; set; }
    public string RecipeId { get; set; }
    public string Version { get; set; }     // Semantic: 1.2.0
    public RecipeStatus Status { get; set; }
    public string PayloadJson { get; set; } // jsonb — بدنهٔ کامل
    public string ChangelogJson { get; set; } // jsonb — تغییرات
    public DateTimeOffset CreatedAt { get; set; }
}
```

---

## ۶) Recipeهای MVP

### سطح ایمنی در MVP:

| سطح | اجازه | توضیح |
|---|---|---|
| LOW | ✅ Approved | چراغ LED، فن USB، تستر باتری، چراغ اضطراری |
| MEDIUM | ✅ Approved | — |
| HIGH | ⚠️ آزمایشی | فقط پاوربانک (غیرعمومی) |
| CRITICAL | ❌ ممنوع | برق شهر — قانون ثابت |

### سیاست HIGH در MVP:
- فقط برای تست داخلی تیم فنی
- در ویترین اصلی نمایش داده نمی‌شود
- Safety Gate کامل اعمال می‌شود

### سیاست CRITICAL در MVP:
- **کاملاً ممنوع** — قانون ثابت پلتفرم
- هیچ Recipe با سطح CRITICAL ایجاد نمی‌شود
- در AI نیز ممنوع است

---

## ۷) ساختار فایل Recipe

### docs/recipes/*.json:

```json
{
  "title": "عنوان فارسی",
  "summary": "خلاصهٔ یک‌خطی",
  "description": "توضیح کامل",
  "category": "lighting | power | cooling | testing | ...",
  "difficulty": "beginner | intermediate | advanced",
  "safetyLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "estimatedMinutes": 30,
  "skills": ["مهارت ۱", "مهارت ۲"],
  "parameters": [...],
  "components": [...],
  "tools": ["ابزار ۱", "ابزار ۲"],
  "steps": [...],
  "tests": [...],
  "safetyWarnings": ["هشدار ۱", "هشدار ۲"],
  "license": "CC-BY-NC-4.0",
  "authorId": "besaz-team",
  "reviewerIds": ["besaz-team"]
}
```

---

## ۸) API Endpoints

### دریافت لیست Recipeها:

```
GET /api/recipes?status=Approved&category=lighting&search=LED
```

### دریافت جزئیات Recipe:

```
GET /api/recipes/{id}
```

### پاسخ:

```json
{
  "id": "RLED-001",
  "title": "چراغ LED USB",
  "slug": "usb-led-lamp",
  "category": "lighting",
  "difficulty": "beginner",
  "safetyLevel": "LOW",
  "estimatedMinutes": 30,
  "status": "Approved",
  "currentVersion": "1.0.0",
  "summary": "یک چراغ مطالعهٔ ساده...",
  "versions": [...],
  "payload": {
    "title": "چراغ LED USB",
    "components": [...],
    "steps": [...],
    "safetyWarnings": [...]
  }
}
```

---

## ۹) اعتبارسنجی RecipeValidator

### بررسی‌ها:

| بررسی | خطا |
|---|---|
| عنوان < ۳ حرف | ❌ |
| دسته‌بندی خالی | ❌ |
| زمان ≤ ۰ | ❌ |
| بدون مهارت | ❌ |
| بدون ابزار | ❌ |
| بدون قطعه | ❌ |
| بدون گام | ❌ |
| بدون لایسنس | ❌ |
| HIGH/CRITICAL بدون هشدار | ❌ |
| کلید پارامتر نامعتبر | ❌ |
| فرمول تعداد نامعتبر | ❌ |

---

## ۱۰) Deprecated خودکار

> وقتی قطعهٔ حیاتی از همهٔ تأمین‌کنندگان OutOfStock شد، Recipe Flag می‌شود.

### پیاده‌سازی (آینده):

```csharp
// Job پس‌زمینه
if (recipe.Components.Any(c => 
    c.IsRequired && 
    !c.SupplierProducts.Any(sp => sp.StockStatus == StockStatus.InStock)))
{
    recipe.Status = RecipeStatus.Deprecated;
    // ارسال هشدار به تیم فنی
}
```

---

## ۱۱) Fork (اشتقاق)

> طراحان می‌توانند نسخهٔ مشتق بسازند؛ مرجع منبع نگه‌داری می‌شود.

### در MVP:
- فقط خواندن Recipeها مجاز است
- ایجاد Recipe جدید فقط توسط ادمین

### در آینده:
- کاربران می‌توانند Fork بگیرند
- مرجع منبع (ParentRecipeId) ذخیره می‌شود
