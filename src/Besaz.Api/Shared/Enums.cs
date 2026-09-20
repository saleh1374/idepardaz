namespace Besaz.Api.Shared;

/// <summary>سطح ایمنی Recipe — مطابق ماتریس ایمنی سند.</summary>
public enum SafetyLevel
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}

/// <summary>وضعیت چرخهٔ عمر Recipe / RecipeVersion.</summary>
public enum RecipeStatus
{
    Draft = 0,
    UnderReview = 1,
    Approved = 2,
    Rejected = 3,
    Deprecated = 4,
    Archived = 5,
}

public enum Difficulty
{
    Beginner = 0,
    Intermediate = 1,
    Advanced = 2,
}

/// <summary>موجودی محصول نزد تأمین‌کننده.</summary>
public enum StockStatus
{
    InStock = 0,
    LowStock = 1,
    OutOfStock = 2,
    Unknown = 3,
}

/// <summary>نقش یک قلم در BOM.</summary>
public enum BomItemRole
{
    Required = 0,
    Optional = 1,
    Alternative = 2,
}

/// <summary>چرخهٔ وضعیت Project به‌عنوان Asset.</summary>
public enum ProjectStatus
{
    Draft = 0,
    Planning = 1,
    BomReady = 2,
    PartsSelected = 3,
    Ordered = 4,
    Building = 5,
    Testing = 6,
    Completed = 7,
    Published = 8,
    Archived = 9,
}

public enum UserRole
{
    Member = 0,
    Reviewer = 1,
    Admin = 2,
}

/// <summary>شدت یک قانون سازگاری در BOM.</summary>
public enum RuleSeverity
{
    Error = 0,
    Warning = 1,
    Info = 2,
}

public static class EnumParsing
{
    public static SafetyLevel ParseSafetyLevel(string? value) => value?.Trim().ToUpperInvariant() switch
    {
        "LOW" => SafetyLevel.Low,
        "MEDIUM" => SafetyLevel.Medium,
        "HIGH" => SafetyLevel.High,
        "CRITICAL" => SafetyLevel.Critical,
        _ => SafetyLevel.Low,
    };

    public static string ToWire(this SafetyLevel level) => level switch
    {
        SafetyLevel.Low => "LOW",
        SafetyLevel.Medium => "MEDIUM",
        SafetyLevel.High => "HIGH",
        _ => "CRITICAL",
    };

    public static Difficulty ParseDifficulty(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        "intermediate" => Difficulty.Intermediate,
        "advanced" => Difficulty.Advanced,
        _ => Difficulty.Beginner,
    };

    public static string ToWire(this Difficulty d) => d switch
    {
        Difficulty.Intermediate => "intermediate",
        Difficulty.Advanced => "advanced",
        _ => "beginner",
    };

    public static string ToWire(this RecipeStatus s) => s switch
    {
        RecipeStatus.Draft => "Draft",
        RecipeStatus.UnderReview => "UnderReview",
        RecipeStatus.Approved => "Approved",
        RecipeStatus.Rejected => "Rejected",
        RecipeStatus.Deprecated => "Deprecated",
        _ => "Archived",
    };
}