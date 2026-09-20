using System.Text.Json;
using System.Text.Json.Serialization;

namespace Besaz.Api.Shared;

/// <summary>کانوِرتر JSON برای enum‌های Wire-Safe — مقادیر متن («LOW»، «beginner») در payload و API.</summary>
public sealed class DifficultyJsonConverter : JsonConverter<Difficulty>
{
    public override Difficulty Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        EnumParsing.ParseDifficulty(reader.GetString());

    public override void Write(Utf8JsonWriter writer, Difficulty value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToWire());
}

public sealed class SafetyLevelJsonConverter : JsonConverter<SafetyLevel>
{
    public override SafetyLevel Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        EnumParsing.ParseSafetyLevel(reader.GetString());

    public override void Write(Utf8JsonWriter writer, SafetyLevel value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToWire());
}

/// <summary>تنظیمات JSON مشترک پلتفرم (قرارداد شمارندهٔ لایه‌ها).</summary>
public static class BesazJson
{
    public static JsonSerializerOptions Options { get; } = Create();

    private static JsonSerializerOptions Create()
    {
        var o = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
        };
        o.Converters.Add(new DifficultyJsonConverter());
        o.Converters.Add(new SafetyLevelJsonConverter());
        return o;
    }
}