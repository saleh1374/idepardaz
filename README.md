# بساز / Besaz

> **کامپایلر ایده برای دنیای فیزیکی** — کاربر خواسته‌اش را به زبان انسانی می‌گوید، سیستم آن را به
> یک «پروژهٔ قابل ساخت» کامپایل می‌کند: Recipe تأییدشده، BOM با قیمت زندهٔ فروشگاه‌های ایرانی،
> آموزش گام‌به‌گام — و دو خروجی: «خودم می‌سازم» یا «بسپار به صنعتگر».

سند طراحی کامل: [`docs/Besaz-Plan-v1.md`](docs/Besaz-Plan-v1.md)

---

## معماری (MVP)

- **Backend — Modular Monolith:** ASP.NET Core (minimal APIs) + EF Core
  - ماژول‌ها: `Recipes` (چرخهٔ نسخه/تأیید + قانون ۳ ایمنی)، `Bom` (BomCalculator خالص + BomEngine)،
    `Components`، `Suppliers` (آخرین قیمت/موجودی)، `Projects`، `Orders`، `Safety`، `Ai`، `Users`
  - دیتابیس: **PostgreSQL** (JSONB + FTS + آماده‌سازی pgvector) با Fallback **SQLite** برای توسعهٔ سریع/CI
  - BOM: قوانین داده‌پایه (`BOM-001..004`)، ExpressionEvaluator برای `qtyFormula`/`affects`
  - AI: `IAiProvider` → Xkiro (Integration Pending) + `StubMatcher` قطعی/آفلاین برای فاز صفر
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4 — RTL فارسی با فونت Vazirmatn
- **Tests:** xUnit + FluentAssertions (۳۰ تست واحد، بخش خالص: ExpressionEvaluator، RecipeValidator، BomCalculator، StubMatcher)

```
USER → AI INTENT → RECIPE → BOM → SUPPLIER → BUILD / MAKER → COMMUNITY
```

Recipeها از `docs/recipes/*.json` خوانده و seed می‌شوند (منبع واحد حقیقت).

---

## اجرای محلی

### پیش‌نیاز
- .NET SDK 9+ (پروژه با SDK 10 قابل build است؛ target فریم‌ورک net9.0)
- Node.js 20.19+ / 22+ (برای فرانت)

### ۱) بک‌اند — بدون Docker (پیشنهادی برای توسعه سریع)

```powershell
# حذف دیتابیس قبلی (در صورت نیاز)
Remove-Item src/Besaz.Api/besaz.db -ErrorAction SilentlyContinue

$env:Database__Provider = "Sqlite"
$env:ASPNETCORE_URLS = "http://localhost:5090"
dotnet run --project src/Besaz.Api
```

- Swagger: http://localhost:5090/swagger
- سلامت: http://localhost:5090/api/health

### ۲) بک‌اند با PostgreSQL (مشابه تولید)

```powershell
docker compose up -d db     # pgvector/pgvector:pg16
$env:Database__Provider = "Postgres"
$env:ConnectionStrings__BesazDb = "Host=localhost;Database=besaz;Username=besaz;Password=besaz"
dotnet run --project src/Besaz.Api
```

### ۳) فرانت‌اند

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173  (proxy /api → http://localhost:5090)
```

### ۴) تست‌ها

```powershell
dotnet test Besaz.slnx
```

---

## ساختار

```
src/Besaz.Api/
  Program.cs              # DI، Serilog، Swagger، CORS، Seed
  Data/                   # AppDbContext + SeedData
  Modules/{Recipes,Bom,Components,Suppliers,Projects,Orders,Safety,Ai,Users}/
  Shared/                 # ExpressionEvaluator, BesazJson, Enums, UserContext
tests/Besaz.Tests/        # تست‌های واحد بخش خالص
frontend/                 # React + Vite + TS + Tailwind (RTL فارسی)
docs/
  Besaz-Plan-v1.md        # سند طرح جامع
  recipe.schema.json      # اسکیمای Recipe
  recipes/*.json          # Recipeهای نمونه (منبع واحد حقیقت)
```

---

## یادداشت‌های اجرا

- **تأیید نسخه (قانون ۳):** سطح HIGH/CRITICAL برای `Approved` به دو بازبین (فنی + ایمنی) نیاز دارد؛
  LOW/MEDIUM به یک بازبین فنی. دروازهٔ ایمنی در فرانت نیز پیش از نمایش BOM اعمال می‌شود.
- **احراز هویت MVP:** هدرهای اختیاری `X-User-Id` / `X-User-Name` (پیش‌فرض Guest).
- **BOM نامعتبر ذخیره نمی‌شود؛** نسخه‌های Recipe غیرقابل تغییرند و Projectها به نسخه lock می‌شوند.
- **Xkiro AI:** بدون کلید (`Xkiro__ApiKey`) از StubMatcher آفلاین استفاده می‌شود.