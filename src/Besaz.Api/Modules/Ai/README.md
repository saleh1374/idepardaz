# ماژول AI — بساز

> **نسخه:** MVP — فقط Understand و Recommend

---

## ۱) خلاصه

ماژول AI در فاز MVP فقط دو کار انجام می‌دهد:
1. **Understand:** فهم جملهٔ کاربر به زبان فارسی
2. **Recommend:** پیشنهاد Recipe از بین چند Recipe تأییدشدهٔ MVP

### کارهایی که در MVP انجام نمی‌شود:
- ❌ **Compose:** ساخت Recipe جدید از صفر
- ❌ **Support:** پشتیبانی فنی و چت زنده
- ❌ **RAG پیشرفته:** بازیابی از pgvector (فعلاً فقط FTS ساده)

---

## ۲) قرارداد خروجی JSON

### درخواست (Request):

```json
{
  "text": "می‌خواهم یک چراغ نور مطالعه با LED و USB بسازم"
}
```

### پاسخ (Response):

```json
{
  "intent": "recipe_selected",
  "requirements": ["LED", "مقاومت", "USB"],
  "missingRequirements": [],
  "recommendedRecipeId": "RLED-001",
  "recommendedRecipeTitle": "چراغ LED USB",
  "confidence": 0.85,
  "warnings": []
}
```

### فیلدهای خروجی:

| فیلد | نوع | توضیح |
|---|---|---|
| `intent` | string | نوع تشخیص: `recipe_selected` یا `no_recipe` |
| `requirements` | string[] | نیازمندی‌های شناسایی‌شده |
| `missingRequirements` | string[] | نیازمندی‌هایی که هنوز مشخص نیست |
| `recommendedRecipeId` | string \| null | شناسهٔ Recipe پیشنهادی |
| `recommendedRecipeTitle` | string \| null | عنوان Recipe پیشنهادی |
| `confidence` | number | میزان اطمینان (۰ تا ۱) |
| `warnings` | string[] | هشدارهای ایمنی |

---

## ۳) قراردادهای ممنوعه (System-Level)

AI در هیچ شرایطی اجازهٔ انجام این کارها را ندارد:

| ممنوعیت | دلیل |
|---|---|
| پیشنهاد باتری لیتیومی بدون BMS | خطر آتش‌سوزی |
| پیشنهاد برق شهر | سطح CRITICAL — ممنوع در MVP |
| ساخت Recipe جدید | فقط Recipeهای تأییدشده |
| نادیده‌گرفتن هشدارهای ایمنی | مسئولیت مهندسی |

---

## ۴) StubMatcher — فاز صفر

وقتی Provider واقعی (Xkiro) پیکربندی نشده باشد، از StubMatcher استفاده می‌شود:

### الگوریتم:
1. ** Normalized text** — حذف کلمات نقشی فارسی (یک، می‌خواهم، لطفاً، ...)
2. ** امتیازدهی** — تطبیق کلمات کلیدی با عنوان و خلاصهٔ Recipeها
3. ** تشخیص خطر** — بررسی کلمات خطرناک (باتری، لیتیوم، برق شهر، ۲۲۰)
4. ** انتخاب بهترین** — Recipe با بیشترین امتیاز

### کلمات نقشی حذف‌شده:

```csharp
"یک", "دو", "چند", "این", "آن", "با", "از", "به", "برای", "که", "را",
"و", "در", "من", "تو", "او", "ما", "شما", "لطفاً", "خواهش", "میکنم",
"می‌خواهم", "میخوام", "هستم", "هست", "است", "دارم", "نیاز",
"ساخت", "ساختن", "بساز", "بسازم", "بسازید", "میشه", "میشود", "می‌شود"
```

### کلمات خطرناک:

```csharp
("باتری", "این درخواست با باتری لیتیومی مرتبط است..."),
("لیتیوم", "این درخواست با باتری لیتیومی مرتبط است..."),
("برق شهر", "مدار برق شهر (CRITICAL) در MVP ارائه نمی‌شود"),
("۲۲۰", "مدار برق شهر (CRITICAL) در MVP ارائه نمی‌شود")
```

---

## ۵) Dataset پیشنهادی برای تست

### ۲۰ جملهٔ واقعی فارسی برای تست StubMatcher:

| # | جمله | Recipe مورد انتظار |
|---|---|---|
| ۱ | می‌خواهم یک چراغ مطالعه بسازم | RLED-001 |
| ۲ | یک چراغ LED USB می‌خواهم | RLED-001 |
| ۳ | چطور یک چراغ ساده بسازم؟ | RLED-001 |
| ۴ | یک فن خنک‌کننده لپ‌تاپ می‌خواهم | UFAN-001 |
| ۵ | فن USB برای کیس کامپیوتر | UFAN-001 |
| ۶ | می‌خوام یک فن بسازم | UFAN-001 |
| ۷ | تستر باتری ساده می‌خواهم | BTEST-001 |
| ۸ | چطور باتری را تست کنم؟ | BTEST-001 |
| ۹ | یک مدار تست باتری | BTEST-001 |
| ۱۰ | چراغ اضطراری برای قطعی برق | ELIGHT-001 |
| ۱۱ | چراغ قابل شارژ اضطراری | ELIGHT-001 |
| ۱۲ | یک چراغ اضطراری ساده | ELIGHT-001 |
| ۱۳ | پاوربانک خودم بسازم | PB-001 (هشدار) |
| ۱۴ | باتری لیتیومی ۱۸۶۵۰ | PB-001 (هشدار) |
| ۱۵ | مدار برق شهر ۲۲۰ ولت | هشدار ممنوعیت |
| ۱۶ | یک ربات ساده بسازم | no_recipe |
| ۱۷ | می‌خواهم گیتار بسازم | no_recipe |
| ۱۸ | یک قاب موبایل چاپ سه‌بعدی | no_recipe |
| ۱۹ | مدار اینورتر خورشیدی | no_recipe |
| ۲۰ | آموزش لحیم‌کاری | no_recipe |

### فایل ذخیره‌سازی:

```json
// docs/ai-test-sentences.json
{
  "version": "1.0",
  "sentences": [
    {
      "id": 1,
      "text": "می‌خواهم یک چراغ مطالعه بسازم",
      "expectedRecipeId": "RLED-001",
      "expectedIntent": "recipe_selected",
      "category": "lighting"
    },
    {
      "id": 2,
      "text": "یک چراغ LED USB می‌خواهم",
      "expectedRecipeId": "RLED-001",
      "expectedIntent": "recipe_selected",
      "category": "lighting"
    }
    // ... ۱۸ جملهٔ دیگر
  ]
}
```

---

## ۶) پیکربندی Xkiro (آینده)

```json
// appsettings.json
{
  "Ai": {
    "Xkiro": {
      "ApiKey": "YOUR_API_KEY",
      "BaseUrl": "https://api.xkiro.com/v1",
      "Model": "gpt-4o-mini"
    }
  }
}
```

### بدون کلید:
- StubMatcher آفلاین و رایگان فعال می‌شود
- هزینهٔ AI تقریباً صفر است

---

## ۷) تست‌ها

### تست‌های واحد StubMatcher:

```csharp
[Fact]
public void Recommend_LedLamp_ReturnsRLED001()
{
    var catalog = new List<IntentEngine.CatalogEntry>
    {
        new("RLED-001", "چراغ LED USB", "یک چراغ مطالعهٔ ساده", "LED USB چراغ"),
        new("UFAN-001", "فن خنک‌کننده USB", "فن کوچک خنک‌کننده", "فن USB خنک"),
    };
    
    var result = StubMatcher.Recommend("می‌خواهم یک چراغ LED بسازم", catalog);
    
    Assert.Equal("RLED-001", result.RecommendedRecipeId);
    Assert.True(result.Confidence > 0.5);
}

[Fact]
public void Recommend_BatteryWarning_DetectsDanger()
{
    var catalog = new List<IntentEngine.CatalogEntry>();
    var result = StubMatcher.Recommend("باتری لیتیومی ۱۸۶۵۰ می‌خواهم", catalog);
    
    Assert.NotEmpty(result.Warnings);
    Assert.Contains(result.Warnings, w => w.Contains("لیتیومی"));
}
```

---

## ۸) نقشهٔ راه AI

| فاز | قابلیت | وضعیت |
|---|---|---|
| MVP | Understand + Recommend (StubMatcher) | ✅ انجام شده |
| فاز ۱ | Understand + Recommend (Xkiro) | Integration Pending |
| فاز ۲ | Compose (ساخت Recipe جدید) | آینده |
| فاز ۳ | RAG + pgvector | آینده |
| فاز ۴ | Support (پشتیبانی فنی) | آینده |
