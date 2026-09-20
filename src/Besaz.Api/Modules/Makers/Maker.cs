using Besaz.Api.Modules.Users;

namespace Besaz.Api.Modules.Makers;

/// <summary>صنعتگر/سازنده — پروفایل + خدمات + نقل‌قول.</summary>
public class Maker
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = "";
    public string? Bio { get; set; }
    public string? Specialties { get; set; } // JSON array: ["PCB","3D-Print","Soldering"]
    public string? City { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public int RatingSum { get; set; }
    public int RatingCount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public User User { get; set; } = null!;
    public ICollection<MakerService> Services { get; set; } = new List<MakerService>();
}

/// <summary>خدمت ارائه‌شده توسط صنعتگر.</summary>
public class MakerService
{
    public int Id { get; set; }
    public Guid MakerId { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = "per_item"; // per_item | per_hour | fixed
    public int LeadTimeDays { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }

    public Maker Maker { get; set; } = null!;
}

/// <summary>درخواست نقل‌قول از صنعتگر.</summary>
public class QuoteRequest
{
    public long Id { get; set; }
    public Guid MakerId { get; set; }
    public long? ProjectId { get; set; }
    public Guid RequesterId { get; set; }
    public string Description { get; set; } = "";
    public string Status { get; set; } = "Pending"; // Pending | Quoted | Accepted | Rejected
    public decimal? QuotedPrice { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }

    public Maker Maker { get; set; } = null!;
}
