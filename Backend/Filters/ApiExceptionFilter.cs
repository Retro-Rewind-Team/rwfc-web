using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace RetroRewindWebsite.Filters;

/// <summary>
/// Turns an unhandled exception in any controller action into a 500, replacing the try/catch that
/// every action used to carry for itself.
/// </summary>
/// <remarks>
/// Route and query values are logged, so the context those hand-written blocks carried (friend
/// code, pid, track id) survives without anybody having to remember to include it. Context that
/// comes from the request body cannot be recovered here, so the few actions that logged such a
/// value keep a targeted try/catch of their own.
/// </remarks>
public class ApiExceptionFilter : IAsyncExceptionFilter
{
    /// <summary>
    /// The 500 this filter produces. Exposed so the few actions that keep a try/catch of their own,
    /// to log context the filter cannot see, still answer callers identically.
    /// </summary>
    public static ObjectResult ServerError() =>
        new(new { error = "An unexpected error occurred" })
        {
            StatusCode = StatusCodes.Status500InternalServerError
        };

    private readonly ILogger<ApiExceptionFilter> _logger;

    public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger) => _logger = logger;

    public Task OnExceptionAsync(ExceptionContext context)
    {
        if (context.ExceptionHandled)
            return Task.CompletedTask;

        // A client that hangs up mid-request surfaces here as a cancellation. Nobody is left to
        // receive a 500 and it is not a fault, so record it quietly rather than as an error.
        if (context.Exception is OperationCanceledException &&
            context.HttpContext.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug(
                "Request aborted by the client during {Action}",
                context.ActionDescriptor.DisplayName);

            context.ExceptionHandled = true;
            return Task.CompletedTask;
        }

        _logger.LogError(
            context.Exception,
            "Unhandled exception in {Action}. Route values: {@RouteValues}. Query: {Query}",
            context.ActionDescriptor.DisplayName,
            context.RouteData.Values,
            context.HttpContext.Request.QueryString.Value);

        // Deliberately generic. The old per-endpoint strings told a caller nothing it could act on,
        // and the frontend never read the body: it reports on status and statusText alone.
        context.Result = ServerError();
        context.ExceptionHandled = true;

        return Task.CompletedTask;
    }
}
