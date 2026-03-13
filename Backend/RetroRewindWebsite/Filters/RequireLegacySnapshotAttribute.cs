using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using RetroRewindWebsite.Services.Application;

namespace RetroRewindWebsite.Filters;

public class RequireLegacySnapshotAttribute : ActionFilterAttribute
{
    public override async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next)
    {
        var leaderboardService = context.HttpContext.RequestServices
            .GetRequiredService<ILeaderboardService>();

        var hasSnapshot = await leaderboardService.HasLegacySnapshotAsync();

        if (!hasSnapshot)
        {
            context.Result = new NotFoundObjectResult("Legacy leaderboard snapshot not available");
            return;
        }

        await next();
    }
}
