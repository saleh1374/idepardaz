using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Makers;
using Besaz.Api.Modules.Orders;
using Besaz.Api.Modules.Projects;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Modules.Users;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Data;

/// <summary>
/// دیتابیس یکپارچه: PostgreSQL (JSONB + FTS + آماده‌سازی pgvector در یک موتور — بخش ۱۲ سند).
/// UTC + میلادی در دیتابیس؛ RTL و تقویم شمسی فقط لایهٔ نمایش.
/// برای اجرای محلی بدون PostgreSQL (توسعهٔ سریع/CI) با SQLite می‌توان اجرا کرد: Database__Provider=Sqlite.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    /// <summary>در Postgres ستون‌ها jsonb هستند؛ در SQLite/آزمون رشتهٔ معمولی.</summary>
    private bool IsPostgres => Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL";
    private bool IsRelational => Database.ProviderName is not null && !Database.ProviderName.Contains("InMemory", StringComparison.Ordinal);

    public DbSet<User> Users => Set<User>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeVersion> RecipeVersions => Set<RecipeVersion>();
    public DbSet<LogicalPart> LogicalParts => Set<LogicalPart>();
    public DbSet<ComponentSpecification> ComponentSpecifications => Set<ComponentSpecification>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierProduct> SupplierProducts => Set<SupplierProduct>();
    public DbSet<PriceHistory> PriceHistories => Set<PriceHistory>();
    public DbSet<Bom> Boms => Set<Bom>();
    public DbSet<BomItem> BomItems => Set<BomItem>();
    public DbSet<BomRuleDefinition> BomRuleDefinitions => Set<BomRuleDefinition>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<SafetyApproval> SafetyApprovals => Set<SafetyApproval>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Maker> Makers => Set<Maker>();
    public DbSet<MakerService> MakerServices => Set<MakerService>();
    public DbSet<QuoteRequest> QuoteRequests => Set<QuoteRequest>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // ---- Identity/Users ----
        b.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Name).IsRequired().HasMaxLength(120);
        });

        // ---- Recipes ----
        b.Entity<Recipe>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasMaxLength(40);
            e.HasIndex(r => r.Slug).IsUnique();
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.Category);
            e.Property(r => r.Title).IsRequired().HasMaxLength(200);
            e.Property(r => r.Slug).IsRequired().HasMaxLength(200);
            e.HasMany(r => r.Versions).WithOne(v => v.Recipe).HasForeignKey(v => v.RecipeId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<RecipeVersion>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => new { v.RecipeId, v.Version }).IsUnique();
            e.HasIndex(v => v.Status);
            e.Property(v => v.Version).IsRequired().HasMaxLength(20);
            if (IsPostgres) e.Property(v => v.PayloadJson).HasColumnType("jsonb");
            e.Property(v => v.PayloadJson).IsRequired();
            if (IsPostgres) e.Property(v => v.ChangelogJson).HasColumnType("jsonb");
            e.Property(v => v.ChangelogJson).IsRequired();
        });

        // ---- Components ----
        b.Entity<LogicalPart>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasMaxLength(40);
            e.HasIndex(p => p.Category);
            e.HasIndex(p => p.NameFa);
            e.Property(p => p.NameFa).IsRequired().HasMaxLength(200);
            e.HasMany(p => p.Specifications).WithOne(s => s.LogicalPart).HasForeignKey(s => s.LogicalPartId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ComponentSpecification>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => new { s.LogicalPartId, s.Key });
            e.Property(s => s.Key).IsRequired().HasMaxLength(60);
            e.Property(s => s.Value).IsRequired().HasMaxLength(200);
        });

        // ---- Suppliers ----
        b.Entity<Supplier>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.Name).IsUnique();
            e.Property(s => s.Name).IsRequired().HasMaxLength(120);
        });

        b.Entity<SupplierProduct>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.SupplierId, p.Sku }).IsUnique();   // ایندکس حیاتی SKU
            e.HasIndex(p => p.Mpn);                                     // ایندکس حیاتی MPN
            e.HasIndex(p => p.LogicalPartId);
            e.Property(p => p.Sku).IsRequired().HasMaxLength(80);
            e.Property(p => p.Title).IsRequired().HasMaxLength(300);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.HasOne(p => p.Supplier).WithMany(s => s.Products).HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.LogicalPart).WithMany(lp => lp.SupplierProducts).HasForeignKey(p => p.LogicalPartId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(p => p.PriceHistory).WithOne(h => h.SupplierProduct).HasForeignKey(h => h.SupplierProductId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PriceHistory>(e =>
        {
            e.HasKey(h => h.Id);
            if (IsRelational)
            {
                e.HasIndex(h => new { h.SupplierProductId, h.CapturedAt }).IsDescending(false, true); // ایندکس حیاتی آخرین قیمت
            }
            e.Property(h => h.Price).HasPrecision(18, 2);
            e.Property(h => h.Source).HasMaxLength(40);
        });

        // ---- BOM ----
        b.Entity<Bom>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasIndex(b => new { b.RecipeId, b.CreatedAt });
            e.Property(b => b.RecipeId).IsRequired();
            if (IsPostgres) e.Property(b => b.ParametersJson).HasColumnType("jsonb");
            if (IsPostgres) e.Property(b => b.ValidationMessagesJson).HasColumnType("jsonb");
            e.Property(b => b.Total).HasPrecision(18, 2);
            e.HasMany(b => b.Items).WithOne(i => i.Bom).HasForeignKey(i => i.BomId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<BomItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.LogicalPartId);
            e.Property(i => i.Quantity).HasPrecision(18, 3);
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.LineTotal).HasPrecision(18, 2);
        });

        b.Entity<BomRuleDefinition>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.Code).IsUnique();
            e.Property(r => r.Code).IsRequired().HasMaxLength(20);
        });

        // ---- Projects ----
        b.Entity<Project>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.UserId, p.Status });   // ایندکس حیاتی Project
            e.Property(p => p.Title).IsRequired().HasMaxLength(200);
            if (IsPostgres) e.Property(p => p.ParametersJson).HasColumnType("jsonb");
            e.Property(p => p.RecipeVersionText).HasMaxLength(60);
        });

        // ---- Orders ----
        b.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.ProjectId);
            e.Property(o => o.Total).HasPrecision(18, 2);
            e.HasMany(o => o.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<OrderItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Quantity).HasPrecision(18, 3);
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.LineTotal).HasPrecision(18, 2);
        });

        b.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.OrderId);
            e.Property(p => p.Amount).HasPrecision(18, 2);
        });

        // ---- Safety ----
        b.Entity<SafetyApproval>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.RecipeVersionId, a.Role }).IsUnique();
            e.Property(a => a.Role).HasMaxLength(20);
            e.Property(a => a.ReviewerId).HasMaxLength(80);
            e.HasOne(a => a.RecipeVersion).WithMany().HasForeignKey(a => a.RecipeVersionId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---- AuditLog (append-only) ----
        b.Entity<AuditLog>(e =>
        {
            e.HasKey(l => l.Id);
            e.HasIndex(l => new { l.EntityType, l.EntityId });
            if (IsPostgres) e.Property(l => l.DataJson).HasColumnType("jsonb");
            // ثبت: فقط Insert — Update/Delete از طریق سرویس ممنوع (سطح دیتابیس: تریگر در فاز بعد)
        });

        // ---- Makers ----
        b.Entity<Maker>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasIndex(m => m.UserId);
            e.HasIndex(m => m.City);
            e.Property(m => m.DisplayName).IsRequired().HasMaxLength(200);
            e.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany(m => m.Services).WithOne(s => s.Maker).HasForeignKey(s => s.MakerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MakerService>(e =>
        {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.MakerId);
            e.Property(s => s.Title).IsRequired().HasMaxLength(200);
            e.Property(s => s.Price).HasPrecision(18, 2);
            e.Property(s => s.Unit).IsRequired().HasMaxLength(40);
        });

        b.Entity<QuoteRequest>(e =>
        {
            e.HasKey(q => q.Id);
            e.HasIndex(q => q.MakerId);
            e.HasIndex(q => q.Status);
            e.Property(q => q.Description).IsRequired().HasMaxLength(2000);
            e.Property(q => q.QuotedPrice).HasPrecision(18, 2);
            e.HasOne(q => q.Maker).WithMany().HasForeignKey(q => q.MakerId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}