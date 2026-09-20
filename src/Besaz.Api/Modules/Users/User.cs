using Besaz.Api.Shared;

namespace Besaz.Api.Modules.Users;

/// <summary>کاربر سادهٔ MVP — احراز هویت واقعی (JWT) در فاز بعد.</summary>
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.Member;
    public DateTimeOffset CreatedAt { get; set; }
}

public static class WellKnownUsers
{
    public static readonly Guid BesazTeam = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public static readonly Guid EngineerReviewer = Guid.Parse("00000000-0000-0000-0000-000000000002");
    public static readonly Guid SafetyReviewer = Guid.Parse("00000000-0000-0000-0000-000000000003");
    public static readonly Guid Guest = Guid.Parse("00000000-0000-0000-0000-000000000004");
}