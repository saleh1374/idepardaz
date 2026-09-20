using Besaz.Api.Modules.Recipes;

namespace Besaz.Api.Modules.Safety;

/// <summary>
/// تأیید ایمنی/فنی یک نسخهٔ Recipe — قانون ۳ سند:
/// سطح HIGH/CRITICAL پیش از Approved به دو بازبین نیاز دارد (یک فنی + یک ایمنی).
/// </summary>
public class SafetyApproval
{
    public long Id { get; set; }
    public long RecipeVersionId { get; set; }
    public string ReviewerId { get; set; } = "";
    public string ReviewerName { get; set; } = "";
    public string Role { get; set; } = "";        // safety | technical
    public string Verdict { get; set; } = "";     // Approved | Rejected
    public string? Note { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public RecipeVersion? RecipeVersion { get; set; }
}

/// <summary>لاگ غیرقابل تغییر (append-only) رویدادهای حساس — Safety Gate و تاریخچهٔ Recipe.</summary>
public class AuditLog
{
    public long Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string EntityType { get; set; } = "";  // Recipe / RecipeVersion / Project / Order / User
    public string EntityId { get; set; } = "";
    public string Action { get; set; } = "";      // Created / Submitted / Approved / Rejected / BomGenerated / ...
    public string? ActorId { get; set; }
    public string? DataJson { get; set; }         // jsonb
}