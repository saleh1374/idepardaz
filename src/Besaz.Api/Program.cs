using Besaz.Api.Data;
using Besaz.Api.Modules.Admin;
using Besaz.Api.Modules.Ai;
using Besaz.Api.Modules.Bom;
using Besaz.Api.Modules.Components;
using Besaz.Api.Modules.Makers;
using Besaz.Api.Modules.Orders;
using Besaz.Api.Modules.Recipes;
using Besaz.Api.Modules.Safety;
using Besaz.Api.Modules.Suppliers;
using Besaz.Api.Modules.Users;
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

if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("besaz");
app.UseSerilogRequestLogging();

// ============ صفحهٔ اصلی ============
app.MapGet("/", () => Results.Content(@"<!DOCTYPE html>
<html lang='fa' dir='rtl'>
<head>
  <meta charset='UTF-8'/>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'/>
  <title>بساز API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 700px; width: 100%; padding: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 900; text-align: center; margin-bottom: 0.5rem; }
    h1 span { background: linear-gradient(135deg, #38bdf8, #2dd4bf); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { text-align: center; color: #94a3b8; margin-bottom: 2.5rem; font-size: 1.1rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .card { background: rgba(30,41,59,0.8); border: 1px solid rgba(148,163,184,0.15); border-radius: 1rem; padding: 1.5rem; text-decoration: none; color: #e2e8f0; transition: all 0.2s; }
    .card:hover { border-color: #38bdf8; transform: translateY(-2px); box-shadow: 0 8px 25px rgba(56,189,248,0.15); }
    .card .icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .card .label { font-weight: 700; font-size: 1rem; }
    .card .desc { color: #94a3b8; font-size: 0.85rem; margin-top: 0.25rem; }
    .status { text-align: center; margin-top: 2rem; padding: 1rem; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 0.75rem; }
    .status .dot { display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-left: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .footer { text-align: center; margin-top: 2rem; color: #475569; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class='container'>
    <h1>⚡ <span>بساز</span> API</h1>
    <p class='subtitle'>کامپایلر ایده برای دنیای فیزیکی</p>
    <div class='grid'>
      <a class='card' href='/api/health'>
        <div class='icon'>💚</div>
        <div class='label'>Health Check</div>
        <div class='desc'>/api/health</div>
      </a>
      <a class='card' href='/api/recipes'>
        <div class='icon'>📋</div>
        <div class='label'>دستورها</div>
        <div class='desc'>/api/recipes</div>
      </a>
      <a class='card' href='/api/parts'>
        <div class='icon'>🧩</div>
        <div class='label'>قطعات</div>
        <div class='desc'>/api/parts</div>
      </a>
      <a class='card' href='/api/makers'>
        <div class='icon'>🏭</div>
        <div class='label'>صنعتگران</div>
        <div class='desc'>/api/makers</div>
      </a>
      <a class='card' href='/api/suppliers'>
        <div class='icon'>📦</div>
        <div class='label'>تأمین‌کنندگان</div>
        <div class='desc'>/api/suppliers</div>
      </a>
      <a class='card' href='/api/projects'>
        <div class='icon'>📁</div>
        <div class='label'>پروژه‌ها</div>
        <div class='desc'>/api/projects</div>
      </a>
      <a class='card' href='/api/orders?page=1'>
        <div class='icon'>🛒</div>
        <div class='label'>سفارشات</div>
        <div class='desc'>/api/orders</div>
      </a>
      <a class='card' href='http://localhost:5173'>
        <div class='icon'>🌐</div>
        <div class='label'>وب‌اپ بساز</div>
        <div class='desc'>localhost:5173</div>
      </a>
    </div>
    <div class='status'>
      <span class='dot'></span> API فعال است
    </div>
    <p class='footer'>بساز / Besaz — MVP · ۱۴۰۵</p>
  </div>
</body>
</html>", "text/html; charset=utf-8"));

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
app.MapAdminEndpoints();
app.MapMakerEndpoints();
app.MapUsersEndpoints();

// ============ آماده‌سازی دیتابیس و Seed (فقط dev) ============
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.SeedAsync(db);
    Log.Information("Database ready — Besaz API ⚡");
}

app.Run();