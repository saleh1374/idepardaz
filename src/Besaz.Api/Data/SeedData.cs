using System.Text.Json;
using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Modules.Users;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Data;

/// <summary>
/// دادهٔ اولیهٔ MVP — فقط وقتی دیتابیس خالی است اجرا می‌شود.
/// Recipeها از docs/recipes/*.json خوانده می‌شوند (منبع واحد حقیقت).
/// </summary>
public static class SeedData
{
    private static readonly JsonSerializerOptions JsonOpts = BesazJson.Options;

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return; // از قبل seed شده

        var now = DateTimeOffset.UtcNow;
        var nowish = now;

        // ---------- Users ----------
        db.Users.AddRange(
            new User { Id = WellKnownUsers.BesazTeam, Name = "تیم بساز", Role = UserRole.Admin, CreatedAt = nowish },
            new User { Id = WellKnownUsers.EngineerReviewer, Name = "بازبین فنی", Role = UserRole.Reviewer, CreatedAt = nowish },
            new User { Id = WellKnownUsers.SafetyReviewer, Name = "بازبین ایمنی", Role = UserRole.Reviewer, CreatedAt = nowish },
            new User { Id = WellKnownUsers.Guest, Name = "میهمان", Role = UserRole.Member, CreatedAt = nowish });

        // ---------- Suppliers ----------
        var eca = new Supplier { Id = Guid.NewGuid(), Name = "ECA", BaseUrl = "https://eshop.eca.ir", CreatedAt = nowish };
        var robo = new Supplier { Id = Guid.NewGuid(), Name = "روبوایران", BaseUrl = "https://roboiran.com", CreatedAt = nowish };
        var cafe = new Supplier { Id = Guid.NewGuid(), Name = "کافه‌ربات", BaseUrl = "https://caferobot.ir", CreatedAt = nowish };
        db.Suppliers.AddRange(eca, robo, cafe);

        // ---------- LogicalPart + Spec + SupplierProduct + PriceHistory ----------
        var part = (string id, string fa, string en, string cat, string unit, string desc,
            (string Key, string Value, string? Unit)[] specs,
            (Supplier S, string Sku, string? Mpn, decimal Price, StockStatus Stock, int Qty, string Url)[] products) =>
        {
            var lp = new LogicalPart
            {
                Id = id, NameFa = fa, NameEn = en, Category = cat, Unit = unit,
                Description = desc, IsActive = true, CreatedAt = nowish,
            };
            foreach (var (key, value, u) in specs)
                lp.Specifications.Add(new ComponentSpecification { Key = key, Value = value, Unit = u });
            db.LogicalParts.Add(lp);

            foreach (var (s, sku, mpn, price, stock, qty, url) in products)
            {
                var sp = new SupplierProduct
                {
                    SupplierId = s.Id, LogicalPartId = id, Sku = sku, Mpn = mpn,
                    Title = $"{fa} — {s.Name}", Price = price, StockStatus = stock, StockQty = qty,
                    Url = url, LastSyncAt = nowish, IsActive = true,
                };
                sp.PriceHistory.Add(new PriceHistory { Price = price, CapturedAt = nowish, Source = "seed" });
                db.SupplierProducts.Add(sp);
            }
        };

        part("LED-5MM-WHITE", "LED سفید ۵ میلی‌متر", "LED 5mm White", "led", "عدد", "LED معمولی ۵ میلی‌متری با ولتاژ رو به جلو ~3.2V",
            [("forwardVoltageV", "3.2", "V"), ("currentMa", "20", "mA")],
            [
                (eca, "LED-S5-W", null, 800, StockStatus.InStock, 800, "https://eshop.eca.ir/product/led-s5-w"),
                (robo, "LEDWHT5", "LED-5W", 900, StockStatus.InStock, 300, "https://roboiran.com/p/led-white-5mm"),
                (cafe, "LED5WH", null, 850, StockStatus.LowStock, 12, "https://caferobot.ir/c/led-5mm-white"),
            ]);

        part("LED-5MM-RED", "LED قرمز ۵ میلی‌متر", "LED 5mm Red", "led", "عدد", "LED قرمز ۵ میلی‌متری (ولتاژ رو به جلو ~2V)",
            [("forwardVoltageV", "2.0", "V"), ("currentMa", "20", "mA")],
            [
                (eca, "LED-S5-R", null, 600, StockStatus.InStock, 500, "https://eshop.eca.ir/product/led-s5-r"),
                (robo, "LEDRED5", null, 700, StockStatus.InStock, 200, "https://roboiran.com/p/led-red-5mm"),
            ]);

        part("RES-470", "مقاومت ۴۷۰ اهم ۱/۴ وات", "Resistor 470Ω", "resistor", "عدد", "مقاومت ۴۷۰ اهمی برای LED در ۵ ولت",
            [("resistanceOhm", "470", "Ω"), ("powerW", "0.25", "W")],
            [
                (eca, "RES-470R", null, 200, StockStatus.InStock, 5000, "https://eshop.eca.ir/product/res-470"),
                (robo, "RES470", null, 250, StockStatus.InStock, 3000, "https://roboiran.com/p/resistor-470"),
                (cafe, "RES-470", null, 220, StockStatus.InStock, 2000, "https://caferobot.ir/c/resistor-470"),
            ]);

        part("USB-A-CABLE", "کابل USB-A (تغذیهٔ ۵ ولت)", "USB-A Cable", "cable", "عدد", "کابل USB-A با دو سیم برق (قرمز/مشکی)",
            [("voltageV", "5", "V")],
            [
                (eca, "USB-CB-A1", null, 45000, StockStatus.InStock, 100, "https://eshop.eca.ir/product/usb-cable-a"),
                (robo, "CBL-USB-A", null, 50000, StockStatus.InStock, 60, "https://roboiran.com/p/usb-cable-a"),
            ]);

        part("SWITCH-SPDT", "کلید قطع/وصل SPDT", "SPDT Switch", "switch", "عدد", "کلید ساده با دو حالت روشن/خاموش",
            [],
            [
                (eca, "SW-SPDT", null, 20000, StockStatus.InStock, 150, "https://eshop.eca.ir/product/sw-spdt"),
                (cafe, "SW-SPDT", null, 22000, StockStatus.LowStock, 8, "https://caferobot.ir/c/switch-spdt"),
            ]);

        part("CELL-18650", "سلول ۱۸۶۵۰ (۳۰۰۰mAh)", "18650 Cell", "battery", "عدد", "سلول لیتیوم‌یونی ۱۸۶۵۰ — فقط با BMS",
            [("capacityMah", "3000", "mAh"), ("voltageNominalV", "3.7", "V"), ("mustUseBms", "true", null)],
            [
                (eca, "18650PR-30", "ICR18650-30", 230000, StockStatus.InStock, 40, "https://eshop.eca.ir/product/18650-3000"),
                (robo, "CELL18-30", null, 245000, StockStatus.InStock, 25, "https://roboiran.com/p/cell-18650"),
                (cafe, "18650-30", null, 250000, StockStatus.LowStock, 6, "https://caferobot.ir/c/cell-18650"),
            ]);

        part("CELL-21700", "سلول ۲۱۷۰۰ (۴۵۰۰mAh)", "21700 Cell", "battery", "عدد", "سلول بزرگ‌تر — جایگزین ۱۸۶۵۰",
            [("capacityMah", "4500", "mAh"), ("voltageNominalV", "3.7", "V"), ("mustUseBms", "true", null)],
            [
                (cafe, "21700-45", null, 260000, StockStatus.OutOfStock, 0, "https://caferobot.ir/c/cell-21700"),
            ]);

        part("BMS-1S", "مدار حفاظت BMS تک‌سلولی", "BMS 1S", "protection", "عدد", "حفاظت ولتاژ کف/سقف و جریان — برای هر سلول الزامی",
            [("maxCurrentA", "3", "A"), ("cells", "1", null)],
            [
                (eca, "BMS-1S-3A", null, 60000, StockStatus.InStock, 80, "https://eshop.eca.ir/product/bms-1s"),
                (robo, "BMS1S", null, 55000, StockStatus.InStock, 50, "https://roboiran.com/p/bms-1s"),
            ]);

        part("BOOST-5V-USB", "مبدل افزایندهٔ ۵ ولت USB (2A)", "Boost 5V USB", "converter", "عدد", "تبدیل ولتاژ سلول به ۵ ولت برای خروجی USB",
            [("outputVoltageV", "5", "V"), ("outputCurrentA", "2", "A")],
            [
                (robo, "BOOST5-USB", null, 90000, StockStatus.InStock, 30, "https://roboiran.com/p/boost-5v-usb"),
                (cafe, "BOOST5V-2A", null, 85000, StockStatus.InStock, 15, "https://caferobot.ir/c/boost-5v-usb"),
            ]);

        part("USB-C-PD-MODULE", "ماژول USB-C PD (۱۸/۶۵W)", "USB-C PD Module", "converter", "عدد", "خروجی USB-C با مذاکرهٔ PD",
            [("protocol", "PD", null), ("maxPowerW", "65", "W")],
            [
                (cafe, "USBC-PD18", null, 180000, StockStatus.InStock, 10, "https://caferobot.ir/c/usb-c-pd"),
            ]);

        part("TP4056-CHARGER", "ماژول شارژر ۱ سلولی TP4056", "TP4056 Charger", "charger", "عدد", "شارژر ۱ سلولی با جریان قابل تنظیم",
            [("chargeCurrentA", "1", "A"), ("cells", "1", null)],
            [
                (eca, "TP4056-M", null, 25000, StockStatus.InStock, 200, "https://eshop.eca.ir/product/tp4056"),
                (robo, "TP4056", null, 27000, StockStatus.InStock, 150, "https://roboiran.com/p/tp4056"),
            ]);

        part("ENCLOSURE-18650", "محفظهٔ استاندارد ۱۸۶۵۰", "18650 Enclosure", "enclosure", "عدد", "محفظهٔ باتری ۱ تا ۲ عددی",
            [],
            [
                (eca, "ENC-18650", null, 120000, StockStatus.InStock, 20, "https://eshop.eca.ir/product/enc-18650"),
            ]);

        part("ENCLOSURE-PRINT3D", "محفظهٔ چاپ سه‌بعدی (سرویس)", "3D-Printed Enclosure", "enclosure", "عدد", "محفظهٔ سفارشی از سرویس چاپ",
            [],
            [
                (robo, "PRT-ENC", null, 95000, StockStatus.InStock, 5, "https://roboiran.com/p/print3d-enclosure"),
            ]);

        part("WIRE-22AWG", "سیم سیلیکونی ۲۲AWG (متر)", "Wire 22AWG", "wire", "متر", "سیم نرم برای اتصالات باتری",
            [],
            [
                (robo, "W22-SIL", null, 15000, StockStatus.InStock, 1000, "https://roboiran.com/p/wire-22awg"),
            ]);

        // ---------- قوانین BOM (قانون‌ها دیتا هستند — بخش ۶ سند) ----------
        db.BomRuleDefinitions.AddRange(
            new BomRuleDefinition { Code = "BOM-001", NameFa = "قطعهٔ الزامی بدون تأمین‌کننده", Description = "هر قطعهٔ Required باید حداقل یک SupplierProduct فعال داشته باشد.", Severity = RuleSeverity.Error },
            new BomRuleDefinition { Code = "BOM-002", NameFa = "قطعهٔ انتخاب‌شده ناموجود", Description = "اگر محصول انتخابی OutOfStock/Unknown باشد هشدار بده.", Severity = RuleSeverity.Warning },
            new BomRuleDefinition { Code = "BOM-003", NameFa = "تعداد قطعه باید مثبت باشد", Description = "تعداد قلم Required باید بزرگ‌تر از صفر باشد.", Severity = RuleSeverity.Error },
            new BomRuleDefinition { Code = "BOM-004", NameFa = "جایگزین در دسترس", Description = "آگاهی از وجود LogicalPart جایگزین.", Severity = RuleSeverity.Info });

        await db.SaveChangesAsync();

        // ---------- Recipeهای نمونه (منبع: docs/recipes) ----------
        var recipesDir = FindRecipesDir();
        var pendingApprovals = new List<(RecipeVersion Version, List<SafetyApproval> Approvals)>();
        if (recipesDir is not null)
        {
            AddPending(pendingApprovals, db, recipesDir, "usb-led-lamp.json", "RLED-001", nowish);
            AddPending(pendingApprovals, db, recipesDir, "pb-001-powerbank.json", "PB-001", nowish);
            AddPending(pendingApprovals, db, recipesDir, "usb-fan.json", "UFAN-001", nowish);
            AddPending(pendingApprovals, db, recipesDir, "battery-tester.json", "BTEST-001", nowish);
            AddPending(pendingApprovals, db, recipesDir, "emergency-light.json", "ELIGHT-001", nowish);
        }

        await db.SaveChangesAsync();

        // قانون ۳: تأییدهای فنی/ایمنی — نسخه‌ها الان Id واقعی دارند؛
        // پس از ذخیرهٔ نسخه‌ها درج می‌شوند تا FK مربوط به RecipeVersionId نامعتبر نباشد.
        foreach (var (version, approvals) in pendingApprovals)
        {
            foreach (var approval in approvals)
            {
                approval.RecipeVersionId = version.Id;
                db.SafetyApprovals.Add(approval);
            }
        }

        await db.SaveChangesAsync();
    }

    private static void AddPending(
        List<(RecipeVersion Version, List<SafetyApproval> Approvals)> pending,
        AppDbContext db, string recipesDir, string file, string recipeId, DateTimeOffset now)
    {
        var created = AddRecipe(db, recipesDir, file, recipeId, now);
        if (created.Version is { } version)
            pending.Add((version, created.Approvals));
    }

    /// <summary>جستجوی پوشهٔ docs/recipes از مسیر جاری به بالا.</summary>
    private static string? FindRecipesDir()
    {
        var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "docs", "recipes");
            if (Directory.Exists(candidate)) return candidate;
            dir = dir.Parent;
        }
        return null;
    }

    private static (RecipeVersion? Version, List<SafetyApproval> Approvals) AddRecipe(
        AppDbContext db, string recipesDir, string file, string recipeId, DateTimeOffset now)
    {
        var empty = ((RecipeVersion?)null, new List<SafetyApproval>());
        var path = Path.Combine(recipesDir, file);
        if (!File.Exists(path)) return empty;

        var json = File.ReadAllText(path);
        var payload = JsonSerializer.Deserialize<RecipePayload>(json, JsonOpts);
        if (payload is null) return empty;

        const string version = "1.0.0";
        var recipe = new Recipe
        {
            Id = recipeId,
            Slug = Path.GetFileNameWithoutExtension(file),
            Title = payload.Title,
            Category = payload.Category,
            Difficulty = payload.Difficulty,
            SafetyLevel = payload.SafetyLevel,
            EstimatedMinutes = payload.EstimatedMinutes,
            Status = RecipeStatus.Approved,
            CurrentVersion = version,
            Summary = payload.Summary,
            CreatedAt = now,
            UpdatedAt = now,
        };

        // قانون ۱: هیچ Recipe بدون نسخه ذخیره نمی‌شود
        var versionEntity = new RecipeVersion
        {
            Version = version,
            Status = RecipeStatus.Approved,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOpts),
            ChangelogJson = "[\"نسخهٔ اولیه — تأیید تیم بساز\"]",
            CreatedAt = now,
        };
        recipe.Versions.Add(versionEntity);
        db.Recipes.Add(recipe);

        // قانون ۳: سطح HIGH/CRITICAL هر دو بازبین (فنی + ایمنی) را می‌خواهد
        // این تأییدها قبل از ذخیرهٔ نسخه درج نمی‌شوند (RecipeVersionId هنوز خالی است)؛
        // توسط SeedAsync پس از SaveChanges با FK واقعی به دیتابیس اضافه می‌شوند.
        var approvals = new List<SafetyApproval>();
        if (payload.SafetyLevel is SafetyLevel.High or SafetyLevel.Critical)
        {
            approvals.Add(new SafetyApproval
            {
                ReviewerId = WellKnownUsers.EngineerReviewer.ToString(),
                ReviewerName = "بازبین فنی",
                Role = "technical",
                Verdict = "Approved",
                CreatedAt = now,
            });
            approvals.Add(new SafetyApproval
            {
                ReviewerId = WellKnownUsers.SafetyReviewer.ToString(),
                ReviewerName = "بازبین ایمنی",
                Role = "safety",
                Verdict = "Approved",
                CreatedAt = now,
            });
        }
        else
        {
            approvals.Add(new SafetyApproval
            {
                ReviewerId = WellKnownUsers.EngineerReviewer.ToString(),
                ReviewerName = "بازبین فنی",
                Role = "technical",
                Verdict = "Approved",
                CreatedAt = now,
            });
        }

        return (versionEntity, approvals);
    }
}