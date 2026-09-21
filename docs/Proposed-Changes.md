# پیشنهاد تغییرات و فایل‌های جدید — پلتفرم بساز

> **نسخه سند:** 1.0 — تاریخ: ۱۴۰۵/۰۷/۰۱

---

## ۱) فایل‌های مستندات جدید

| فایل | توضیح | اولویت |
|---|---|---|
| `docs/MVP-Summary.md` | خلاصهٔ MVP و تعریف دقیق | 🔴 بالا |
| `docs/MVP-User-Flows.md` | جریان‌های کاربر با Wireframe متنی | 🔴 بالا |
| `docs/Safety-Policy.md` | سیاست ایمنی و شرایط استفاده | 🔴 بالا |
| `docs/BOM-Suppliers-Guide.md` | راهنمای BOM Engine و تأمین‌کنندگان | 🟡 متوسط |
| `docs/Community-Makers.md` | جامعه و صنعتگران | 🟡 متوسط |
| `docs/ai-test-sentences.json` | ۲۰ جملهٔ تست AI | 🟢 پایین |
| `src/Besaz.Api/Modules/Ai/README.md` | راهنمای ماژول AI | 🔴 بالا |
| `src/Besaz.Api/Modules/Recipes/README.md` | راهنمای ماژول Recipes | 🔴 بالا |

---

## ۲) اصلاح README اصلی

### بخش‌های جدید پیشنهادی:

```markdown
## برای کاربر عادی این یعنی چه؟

بساز یک پلتفرم ساده و کاربردی است که به شما کمک می‌کند:
- از بین چند پروژهٔ آماده، بهترین را انتخاب کنید
- یا با ویزارد فارسی، پروژهٔ مناسب خودتان را پیدا کنید
- قطعات مورد نیاز را با قیمت واقعی فروشگاه‌های ایرانی ببینید
- آموزش گام‌به‌گام فارسی دریافت کنید
- پروژه‌تان را «خودم می‌سازم» یا «بسپار به صنعتگر» ثبت کنید

## سناریوی MVP

۱. وارد سایت شوید
۲. روی «شروع با ویزارد» کلیک کنید
۳. خواسته‌تان را بنویسید (مثلاً: یک چراغ LED USB می‌خواهم)
۴. بهترین پروژه را انتخاب کنید
۵. قطعات را با قیمت واقعی ببینید
۶. آموزش گام‌به‌گام را دنبال کنید
۷. پروژه‌تان را ثبت کنید

## لینک به اسناد جزئی‌تر

- [خلاصهٔ MVP](docs/MVP-Summary.md)
- [جریان‌های کاربر](docs/MVP-User-Flows.md)
- [سیاست ایمنی](docs/Safety-Policy.md)
- [راهنمای BOM](docs/BOM-Suppliers-Guide.md)
- [جامعه و صنعتگران](docs/Community-Makers.md)
```

---

## ۳) ساختار پوشه‌های پیشنهادی

```
docs/
  MVP-Summary.md              # خلاصهٔ MVP
  MVP-User-Flows.md           # جریان‌های کاربر
  Safety-Policy.md            # سیاست ایمنی و حقوقی
  BOM-Suppliers-Guide.md      # راهنمای BOM
  Community-Makers.md         # جامعه و صنعتگران
  Besaz-Plan-v1.md            # سند طرح جامع (موجود)
  recipe.schema.json          # اسکیمای Recipe (موجود)
  recipes/*.json              # Recipeهای نمونه (موجود)
  ai-test-sentences.json      # جملات تست AI (جدید)

src/Besaz.Api/Modules/
  Ai/
    README.md                 # راهنمای ماژول AI (جدید)
    AiEndpoints.cs            # موجود
    IAiProvider.cs            # موجود
    IntentEngine.cs           # موجود
  Recipes/
    README.md                 # راهنمای ماژول Recipes (جدید)
    Recipe.cs                 # موجود
    RecipePayload.cs          # موجود
    RecipesEndpoints.cs       # موجود
    RecipeValidator.cs        # موجود
  Bom/
    README.md                 # راهنمای ماژول BOM (جدید)
    BomCalculator.cs          # موجود
    BomEndpoints.cs           # موجود
    BomEngine.cs              # موجود
    BomEntities.cs            # موجود
  Suppliers/
    README.md                 # راهنمای ماژول Suppliers (جدید)
    Supplier.cs               # موجود
    SuppliersEndpoints.cs     # موجود
```

---

## ۴) تغییرات پیشنهادی در کد

### ۱. اضافه‌کردن صفحهٔ شرایط استفاده

```tsx
// frontend/src/pages/TermsPage.tsx
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1>شرایط استفاده از بساز</h1>
      {/* محتوای شرایط استفاده از docs/Safety-Policy.md */}
    </div>
  )
}
```

### ۲. اضافه‌کردن لینک شرایط استفاده در Footer

```tsx
// frontend/src/components/Footer.tsx
<Link to="/terms">شرایط استفاده</Link>
```

### ۳. اضافه‌کردن Route برای صفحهٔ شرایط استفاده

```tsx
// frontend/src/App.tsx
<Route path="/terms" element={<TermsPage />} />
```

### ۴. بهبود بخش صنعتگران در لندینگ

```tsx
// frontend/src/components/MakerWaitlist.tsx
export default function MakerWaitlist() {
  // فرم ثبت‌نام صنعتگر
}
```

### ۵. اضافه‌کردن بخش Featured Projects در لندینگ

```tsx
// frontend/src/components/FeaturedProjects.tsx
export default function FeaturedProjects() {
  // پروژه‌های منتخب
}
```

---

## ۵) اولویت‌بندی اجرا

### فوری (هفتهٔ اول):
1. ✅ ایجاد فایل‌های مستندات جدید
2. اصلاح README اصلی
3. اضافه‌کردن صفحهٔ شرایط استفاده
4. اضافه‌کردن لینک شرایط استفاده در Footer

### مهم (هفتهٔ دوم):
5. اضافه‌کردن فرم صنعتگران به لندینگ
6. اضافه‌کردن بخش Featured Projects
7. بهبود صفحهٔ ویزارد (سؤالات بیشتر)

### معمولی (هفتهٔ سوم):
8. اضافه‌کردن فایل ai-test-sentences.json
9. بهبود تست‌های AI
10. بهبود مستندات BOM

---

## ۶) بررسی کدهای موجود

### مشکلات شناسایی‌شده:

| مشکل | فایل | توضیح |
|---|---|---|
| تعداد LED در BOM | `usb-led-lamp.json` | `qtyFormula: "ledCount"` — درست است |
| مقاومت در BOM | `usb-led-lamp.json` | `qtyFormula: "ledCount"` — درست است |
| Safety Gate | `SafetyGate.tsx` | فقط HIGH/CRITICAL — درست است |
| StubMatcher | `IntentEngine.cs` | کلمات نقشی فارسی حذف می‌شوند — درست است |

### پیشنهادات بهبود:

| پیشنهاد | فایل | توضیح |
|---|---|---|
| اضافه‌کردن تست‌های بیشتر | `IntentEngine.cs` | تست ۲۰ جمله |
| بهبود فرمت قیمت | `BomPanel.tsx` | نمایش فارسی قیمت |
| اضافه‌کردن Skeleton | `HomePage.tsx` | بارگذاری بهتر |
