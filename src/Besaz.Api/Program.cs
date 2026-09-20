using Besaz.Api.Data;
using Besaz.Api.Modules.Ai;
using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Orders;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Suppliers;
using Microsoft.EntityFrameworkCore;
using Serilog;

// ============ بساز / Besaz — Modular Monolith (بخش ۱۲ سند) ============

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();
builder.Host.UseSerilog();

// دیتابیس: پیش‌فرض PostgreSQL (JSONB + FTS + pgvector در یک موتور).
// برای اجرای محلی بدون Postgres: Database__Provider=Sqlite (توسعه/CI).
builder.Services.AddDbContext<AppDbContext>(o =>
{
    var provider = builder.Configuration["Database:Provider"] ?? "Postgres";
    switch (provider.ToLowerInvariant())
    {
        case "sqlite":
            o.UseSqlite(builder.Configuration.GetConnectionString("BesazSqlite") ?? "Data Source=besaz.db");
            break;
        default:
            o.UseNpgsql(builder.Configuration.GetConnectionString("BesazDb"));
            break;
    }
});

// لایهٔ ۷: AI — Provider سازگار OpenAI (اولین adapter: Xkiro — Integration Pending)
builder.Services.AddHttpClient<XkiroAiProvider>();
builder.Services.AddSingleton<IAiProvider>(sp => sp.GetRequiredService<XkiroAiProvider>());
builder.Services.AddScoped<IntentEngine>();

// لایهٔ ۴ و ۵: BOM + Supplier
builder.Services.AddScoped<BomEngine>();

builder.Services.AddCors(o => o.AddPolicy("besaz", p => p
    .WithOrigins(
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("besaz");
app.UseSerilogRequestLogging();

// ============ API ============
app.MapGet("/api/health", async (AppDbContext db, CancellationToken ct) =>
{
    var dbOk = await db.Database.CanConnectAsync(ct);
    return Results.Ok(new { status = "ok", db = dbOk ? "ok" : "error", time = DateTimeOffset.UtcNow });
});

app.MapRecipesEndpoints();
app.MapComponentsEndpoints();
app.MapSuppliersEndpoints();
app.MapBomEndpoints();
app.MapOrdersEndpoints();
app.MapAiEndpoints();
app.MapSafetyEndpoints();

// ============ آماده‌سازی دیتابیس و Seed (فقط dev) ============
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.SeedAsync(db);
    Log.Information("Database ready — Besaz API ⚡");
}

app.Run();