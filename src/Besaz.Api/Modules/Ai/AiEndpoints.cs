using Besaz.Api.Data;
using Besaz.Api.Modules.Ai;
using Microsoft.EntityFrameworkCore;

namespace Besaz.Api.Modules.Ai;

/// <summary>لایهٔ ۲ معماری — AI Intent Wizard. دستیار، نه مرجع ایمنی (بخش ۷ سند).</summary>
public static class AiEndpoints
{
    public static IEndpointRouteBuilder MapAiEndpoints(this IEndpointRouteBuilder app, string prefix = "/api/ai")
    {
        var g = app.MapGroup(prefix);
        g.MapPost("/intent", Understand);
        return app;
    }

    public sealed record IntentRequest(string Text);

    private static async Task<IResult> Understand(AppDbContext db, IntentEngine engine, IntentRequest req)
    {
        var result = await engine.UnderstandAsync(req.Text, CancellationToken.None);

        string? recipeTitle = null;
        if (result.RecommendedRecipeId is not null)
        {
            var recipe = await db.Recipes.AsNoTracking()
                .Where(r => r.Id == result.RecommendedRecipeId)
                .Select(r => new { r.Id, r.Title, r.Slug })
                .FirstOrDefaultAsync();
            recipeTitle = recipe?.Title;
        }

        return Results.Ok(new
        {
            intent = result.Intent,
            requirements = result.Requirements,
            missingRequirements = result.MissingRequirements,
            recommendedRecipeId = result.RecommendedRecipeId,
            recommendedRecipeTitle = recipeTitle,
            confidence = result.Confidence,
            warnings = result.Warnings,
        });
    }
}