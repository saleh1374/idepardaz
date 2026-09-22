using System.Text.Json;
using Besaz.Api.Data;
using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Makers;
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
            new User { Id = WellKnownUsers.BesazTeam, Name = "تیم بساز", Email = "admin@besaz.ir", Phone = "0210000000", Role = UserRole.Admin, CreatedAt = nowish },
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

        // ---------- قطعات چراغ اضطراری (MVP) ----------
        part("BATT-LIPO-RECHARGEABLE", "باتری لیتیومی قابل شارژ (LP)", "LiPo Rechargeable Battery", "battery", "عدد", "باتری لیتیوم‌پلیمری قابل شارژ برای تغذیه LED",
            [("capacityMah", "1200", "mAh"), ("voltageNominalV", "3.7", "V")],
            [
                (eca, "Lipo-1200", null, 180000, StockStatus.InStock, 30, "https://eshop.eca.ir/product/lipo-1200"),
                (robo, "LIPO1200", null, 190000, StockStatus.InStock, 20, "https://roboiran.com/p/lipo-1200"),
            ]);

        part("CHARGE-MODULE-USB", "ماژول شارژ USB با مدیریت شارژ", "USB Charge Module", "charger", "عدد", "ماژول شارژ با حفاظت از شارژ بیش از حد — ورودی USB ۵ ولت",
            [("chargeCurrentA", "1", "A"), ("inputVoltageV", "5", "V")],
            [
                (eca, "CHGUSB-01", null, 25000, StockStatus.InStock, 200, "https://eshop.eca.ir/product/charge-module-usb"),
                (robo, "CHG-USB", null, 27000, StockStatus.InStock, 150, "https://roboiran.com/p/charge-module-usb"),
            ]);

        part("RES-100", "مقاومت ۱۰۰ اهم ۱/۴ وات", "Resistor 100Ω", "resistor", "عدد", "مقاومت ۱۰۰ اهمی برای محدودکردن جریان LED",
            [("resistanceOhm", "100", "Ω"), ("powerW", "0.25", "W")],
            [
                (eca, "RES-100R", null, 200, StockStatus.InStock, 5000, "https://eshop.eca.ir/product/res-100"),
                (robo, "RES100", null, 250, StockStatus.InStock, 3000, "https://roboiran.com/p/resistor-100"),
                (cafe, "RES-100", null, 220, StockStatus.InStock, 2000, "https://caferobot.ir/c/resistor-100"),
            ]);

        part("ENCLOSURE-PLASTIC", "قاب پلاستیکی چندمنظوره", "Plastic Enclosure", "enclosure", "عدد", "قاب پلاستیکی با پایه برای نصب دیواری یا رومیزی",
            [("material", "ABS", null), ("mountType", "wall-desktop", null)],
            [
                (robo, "ENC-PLST", null, 95000, StockStatus.InStock, 15, "https://roboiran.com/p/enclosure-plastic"),
                (eca, "ENC-PLST-01", null, 90000, StockStatus.InStock, 10, "https://eshop.eca.ir/product/enclosure-plastic"),
            ]);

        // ---------- قطعات USB فن (MVP) ----------
        part("DC-FAN-5V", "فن DC ۵ ولت", "DC Fan 5V", "fan", "عدد", "فن کوچک ۵ ولتی مناسب فنهای USB",
            [("voltageV", "5", "V"), ("size", "40", "mm")],
            [
                (robo, "FAN-5V-40", null, 45000, StockStatus.InStock, 25, "https://roboiran.com/p/fan-5v-40mm"),
                (eca, "FAN5V-40", null, 42000, StockStatus.InStock, 30, "https://eshop.eca.ir/product/fan-5v"),
            ]);

        // ---------- قطعات تستر باتری (MVP) ----------
        part("LED-5MM-GREEN", "LED سبز ۵ میلی‌متر", "LED 5mm Green", "led", "عدد", "LED سبز ۵ میلی‌متری (ولتاژ رو به جلو ~2.1V)",
            [("forwardVoltageV", "2.1", "V"), ("currentMa", "20", "mA")],
            [
                (eca, "LED-S5-G", null, 800, StockStatus.InStock, 600, "https://eshop.eca.ir/product/led-s5-g"),
                (robo, "LEDGRN5", null, 900, StockStatus.InStock, 250, "https://roboiran.com/p/led-green-5mm"),
            ]);

        part("RES-1K", "مقاومت ۱ کیلوام ۱/۴ وات", "Resistor 1KΩ", "resistor", "عدد", "مقاومت ۱ کیلوامی برای محدودکردن جریان LED در تستر باتری",
            [("resistanceOhm", "1000", "Ω"), ("powerW", "0.25", "W")],
            [
                (eca, "RES-1KR", null, 200, StockStatus.InStock, 5000, "https://eshop.eca.ir/product/res-1k"),
                (robo, "RES1K", null, 250, StockStatus.InStock, 3000, "https://roboiran.com/p/resistor-1k"),
                (cafe, "RES-1K", null, 220, StockStatus.InStock, 2000, "https://caferobot.ir/c/resistor-1k"),
            ]);

        part("BATTERY-HOLDER", "نگهدارنده باتری قلمی/AA", "Battery Holder AA", "holder", "عدد", "نگهدارنده باتری ۱ تا ۴ عددی AA/AAA با سیم",
            [("compatible", "AA/AAA", null), ("cellCount", "1-4", null)],
            [
                (robo, "BTH-AA", null, 25000, StockStatus.InStock, 40, "https://roboiran.com/p/battery-holder-aa"),
                (eca, "BH-AA1", null, 22000, StockStatus.InStock, 50, "https://eshop.eca.ir/product/battery-holder"),
            ]);

        // ---------- قوانین BOM (قانون‌ها دیتا هستند — بخش ۶ سند) ----------
        db.BomRuleDefinitions.AddRange(
            new BomRuleDefinition { Code = "BOM-001", NameFa = "قطعهٔ الزامی بدون تأمین‌کننده", Description = "هر قطعهٔ Required باید حداقل یک SupplierProduct فعال داشته باشد.", Severity = RuleSeverity.Error },
            new BomRuleDefinition { Code = "BOM-002", NameFa = "قطعهٔ انتخاب‌شده ناموجود", Description = "اگر محصول انتخابی OutOfStock/Unknown باشد هشدار بده.", Severity = RuleSeverity.Warning },
            new BomRuleDefinition { Code = "BOM-003", NameFa = "تعداد قطعه باید مثبت باشد", Description = "تعداد قلم Required باید بزرگ‌تر از صفر باشد.", Severity = RuleSeverity.Error },
            new BomRuleDefinition { Code = "BOM-004", NameFa = "جایگزین در دسترس", Description = "آگاهی از وجود LogicalPart جایگزین.", Severity = RuleSeverity.Info });

        await db.SaveChangesAsync();

        // ---------- صنعتگران ----------
        var makerUser1 = new User { Id = Guid.NewGuid(), Name = "علی رضایی", Email = "ali@example.com", Phone = "09121234567", Role = UserRole.Member, CreatedAt = nowish };
        var makerUser2 = new User { Id = Guid.NewGuid(), Name = "سارا محمدی", Email = "sara@example.com", Phone = "09359876543", Role = UserRole.Member, CreatedAt = nowish };
        var makerUser3 = new User { Id = Guid.NewGuid(), Name = "محمد حسینی", Email = "mohammad@example.com", Phone = "09191112233", Role = UserRole.Member, CreatedAt = nowish };
        db.Users.AddRange(makerUser1, makerUser2, makerUser3);

        var maker1 = new Maker
        {
            Id = Guid.NewGuid(), UserId = makerUser1.Id,
            DisplayName = "عصرالکترونیک", Bio = "طراحی و ساخت بردهای الکترونیکی، چاپ PCB، مونتاژ SMD",
            Specialties = "[\"PCB\",\"SMD\",\"Soldering\"]", City = "تهران",
            IsVerified = true, RatingSum = 45, RatingCount = 12, IsActive = true, CreatedAt = nowish,
        };
        var maker2 = new Maker
        {
            Id = Guid.NewGuid(), UserId = makerUser2.Id,
            DisplayName = "فاب lab مشهد", Bio = "سرویس چاپ سه‌بعدی، طراحی مکانیکی، ساخت بدنه و محفظه",
            Specialties = "[\"3D-Print\",\"CNC\",\"Enclosure\"]", City = "مشهد",
            IsVerified = true, RatingSum = 38, RatingCount = 10, IsActive = true, CreatedAt = nowish,
        };
        var maker3 = new Maker
        {
            Id = Guid.NewGuid(), UserId = makerUser3.Id,
            DisplayName = "تهرانmaker", Bio = "مونتاژ و تست پروژه‌های الکترونیکی، آموزش و مشاوره",
            Specialties = "[\"Assembly\",\"Testing\",\"Training\"]", City = "تهران",
            IsVerified = false, RatingSum = 15, RatingCount = 5, IsActive = true, CreatedAt = nowish,
        };
        db.Makers.AddRange(maker1, maker2, maker3);

        // ---------- خدمات صنعتگران ----------
        db.MakerServices.AddRange(
            new MakerService { MakerId = maker1.Id, Title = "چاپ PCB تک‌لایه", Description = "چاپ بردهای مسی تک‌لایه تا ۱۰۰×۱۰۰mm", Price = 150000, Unit = "per_item", LeadTimeDays = 3, IsActive = true, CreatedAt = nowish },
            new MakerService { MakerId = maker1.Id, Title = "مونتاژ SMD", Description = "مونتاژ قطعات SMD با دقت بالا", Price = 50000, Unit = "per_item", LeadTimeDays = 2, IsActive = true, CreatedAt = nowish },
            new MakerService { MakerId = maker2.Id, Title = "چاپ سه‌بعدی PLA/PETG", Description = "چاپ سه‌بعدی با کیفیت بالا، رنگ‌های متنوع", Price = 80000, Unit = "per_item", LeadTimeDays = 2, IsActive = true, CreatedAt = nowish },
            new MakerService { MakerId = maker2.Id, Title = "طراحی محفظه", Description = "طراحی محفظه سفارشی با Fusion360/SolidWorks", Price = 500000, Unit = "fixed", LeadTimeDays = 5, IsActive = true, CreatedAt = nowish },
            new MakerService { MakerId = maker3.Id, Title = "مونتاژ و تست", Description = "مونتاژ کامل پروژه + تست عملکرد", Price = 200000, Unit = "per_item", LeadTimeDays = 4, IsActive = true, CreatedAt = nowish },
            new MakerService { MakerId = maker3.Id, Title = "مشاوره الکترونیک", Description = "مشاوره طراحی مدار و انتخاب قطعات", Price = 300000, Unit = "per_hour", LeadTimeDays = 1, IsActive = true, CreatedAt = nowish }
        );

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