using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Projects;

/// <summary>
/// Project — «Asset» کاربر (بخش ۱۱ سند)؛ شبیه ریپوی GitHub برای ساخت.
/// به یک RecipeVersion دقیق lock می‌شود؛ وضعیت‌اش چرخهٔ ساخت را نشان می‌دهد.
/// </summary>
public class Project
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public Guid UserId { get; set; }
    public string UserDisplayName { get; set; } = "";
    public string RecipeId { get; set; } = "";
    public string RecipeVersionText { get; set; } = "";  // lock: PB-001@1.2.0
    public string ParametersJson { get; set; } = "{}";    // jsonb
    public ProjectStatus Status { get; set; } = ProjectStatus.Draft;
    public bool IsPublic { get; set; } = false;
    public long? BomId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}