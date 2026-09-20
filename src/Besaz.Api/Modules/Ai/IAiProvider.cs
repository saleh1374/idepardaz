namespace Besaz.Api.Modules.Ai;

/// <summary>قرارداد Provider هوش مصنوعی (بخش ۷ سند) — تعویض‌پذیری کامل.</summary>
public interface IAiProvider
{
    string Name { get; }
    bool IsConfigured { get; }

    /// <summary>گفت‌وگوی یک‌مرحله‌ای با خروجی ساخت‌یافته (JSON) یا متن.</summary>
    Task<AiChatResult> ChatAsync(AiChatRequest request, CancellationToken ct);
}

public sealed record AiChatRequest(string Prompt, string? SystemPrompt = null, string? ExpectedJsonSchema = null);

public sealed record AiChatResult(string Content, string? StructuredJson = null);

/// <summary>
/// Provider اولین‌بار (فاز صفر): سازگار با OpenAI (مثل xKiro) — Integration Pending.
/// بدون کلید، این Provider غیرفعال است و لازم است StubMatcher جایگزین شود.
/// </summary>
public sealed class XkiroAiProvider : IAiProvider
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private readonly string _baseUrl;

    public XkiroAiProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Ai:Xkiro:ApiKey"];
        _baseUrl = config["Ai:Xkiro:BaseUrl"] ?? "https://api.xkiro.com/v1";
    }

    public string Name => "Xkiro";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<AiChatResult> ChatAsync(AiChatRequest request, CancellationToken ct)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("XkiroAiProvider بدون کلید پیکربندی شده است.");

        var body = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = request.SystemPrompt ?? "" },
                new { role = "user", content = request.Prompt },
            },
            response_format = request.ExpectedJsonSchema is null
                ? null
                : new { type = "json_object" },
        };

        using var resp = await _http.PostAsJsonAsync($"{_baseUrl}/chat/completions", body, ct);
        resp.EnsureSuccessStatusCode();
        var json = await resp.Content.ReadAsStringAsync(ct);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";

        return new AiChatResult(content, request.ExpectedJsonSchema is null ? null : content);
    }
}