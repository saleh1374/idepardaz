using System.Text.Json;
using Besaz.Api.Data;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Shared;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Bom;

/// <summary>
/// هماهنگ‌کنندهٔ BOM روی دیتابیس: بارگذاری نسخهٔ قفل‌شده، کاتالوگ partها، محصولات و قوانین،
/// سپس فراخوانی محاسبه‌گر خالص. BOM نامعتبر هرگز ذخیره نمی‌شود.
/// </summary>
public class BomEngine
{
    private static readonly JsonSerializerOptions JsonOpts = BesazJson.Options;

    private readonly AppDbContext _db;

    public BomEngine(AppDbContext db) => _db = db;

    public sealed record GenerateRequest(
        string RecipeId,
        int? VersionId,
        IReadOnlyDictionary<string, object?> Parameters,
        long? ProjectId = null);

    public sealed record GenerateResult(
        bool IsValid,
        IReadOnlyList<string> Errors,
        IReadOnlyList<string> Warnings,
        long? BomId,
        decimal? Total,
        string RecipeTitle,
        string RecipeVersion,
        IReadOnlyList<BomItemReadModel> Items);

    public sealed record BomItemReadModel(
        string LogicalPartId, string LogicalPartName, string Role, decimal Quantity,
        long? SupplierProductId, string? SupplierName, string? Sku,
        decimal? UnitPrice, decimal? LineTotal, string? StockStatus, string? Url, string? Notes);

    public async Task<GenerateResult> GenerateAsync(GenerateRequest request, CancellationToken ct)
    {
        var recipe = await _db.Recipes
            .Include(r => r.Versions)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.RecipeId, ct);
        if (recipe is null)
            return ErrorResult(request, new[] { $"Recipe «{request.RecipeId}» یافت نشد." });

        var version = request.VersionId.HasValue
            ? recipe.Versions.FirstOrDefault(v => v.Id == request.VersionId.Value)
            : recipe.Versions
                .Where(v => v.Status == RecipeStatus.Approved)
                .OrderByDescending(v => v.CreatedAt)
                .FirstOrDefault();

        if (version is null)
            return ErrorResult(request, new[] { "نسخهٔ Approved برای این Recipe موجود نیست (هنوز در حال بازبینی است)." });

        RecipePayload payload;
        try
        {
            payload = JsonSerializer.Deserialize<RecipePayload>(version.PayloadJson, JsonOpts)!;
        }
        catch (Exception ex)
        {
            return ErrorResult(request, new[] { $"بارگذاری payload نسخه ناموفق بود: {ex.Message}" });
        }

        // کاتالوگ قطعات + محصولات + قوانین
        var partIds = payload.ComponentsList.Select(c => c.LogicalPartId)
            .Concat(payload.ComponentsList.SelectMany(c => c.AlternativesList))
            .Distinct()
            .ToArray();

        var parts = await _db.LogicalParts
            .Where(p => partIds.Contains(p.Id))
            .Include(p => p.SupplierProducts).ThenInclude(sp => sp.Supplier)
            .AsNoTracking()
            .ToDictionaryAsync(p => p.Id, ct);

        var rules = await _db.BomRuleDefinitions.Where(r => r.IsActive).AsNoTracking().ToListAsync(ct);

        var computation = BomCalculator.Compute(payload, request.Parameters, parts,
            parts.ToDictionary(p => p.Key, p => (IReadOnlyList<SupplierProduct>)p.Value.SupplierProducts.ToList()),
            rules);

        if (!computation.IsValid)
            return ErrorResult(request, computation.Errors.ToArray(), computation.Warnings.ToArray());

        // ذخیره‌ی BOM معتبر + snapshot قیمت
        var bom = new Bom
        {
            RecipeId = recipe.Id,
            RecipeVersionId = version.Id,
            RecipeVersionText = $"{recipe.Id}@{version.Version}",
            ProjectId = request.ProjectId,
            ParametersJson = JsonSerializer.Serialize(request.Parameters, JsonOpts),
            IsValid = true,
            Total = computation.Total,
            ValidationMessagesJson = JsonSerializer.Serialize(computation.Warnings, JsonOpts),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        foreach (var line in computation.Lines)
        {
            bom.Items.Add(new BomItem
            {
                Role = line.Role,
                LogicalPartId = line.LogicalPartId,
                LogicalPartName = line.PartName,
                Quantity = line.Quantity,
                SupplierProductId = line.SupplierProductId,
                SupplierName = line.SupplierName,
                Sku = line.Sku,
                UnitPrice = line.UnitPrice,
                LineTotal = line.LineTotal,
                StockStatus = line.StockStatus,
                Url = line.Url,
                Notes = line.Notes,
            });
        }

        _db.Boms.Add(bom);
        await _db.SaveChangesAsync(ct);

        var items = bom.Items.Select(i => new BomItemReadModel(
            i.LogicalPartId, i.LogicalPartName, i.Role.ToString(), i.Quantity,
            i.SupplierProductId, i.SupplierName, i.Sku, i.UnitPrice, i.LineTotal,
            i.StockStatus?.ToString(), i.Url, i.Notes)).ToList();

        return new GenerateResult(true, Array.Empty<string>(), computation.Warnings.ToArray(),
            bom.Id, bom.Total, recipe.Title, version.Version, items);
    }

    public async Task<Bom?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.Boms.Include(b => b.Items).AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, ct);

    private static GenerateResult ErrorResult(GenerateRequest request, string[] errors, string[]? warnings = null) =>
        new(false, errors, warnings ?? Array.Empty<string>(), null, null, "", "", Array.Empty<BomItemReadModel>());
}