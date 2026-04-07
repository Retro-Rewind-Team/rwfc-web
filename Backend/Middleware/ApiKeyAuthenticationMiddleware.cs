using Microsoft.Extensions.Primitives;
using System.Security.Cryptography;
using System.Text;

namespace RetroRewindWebsite.Middleware;

/// <summary>
/// Guards all <c>/api/moderation/*</c> routes with Bearer token authentication.
/// The expected secret is read from the <c>WfcSecret</c> configuration key, falling back to the
/// <c>WFC_SECRET</c> environment variable. All other routes are passed through unconditionally.
/// </summary>
public class ApiKeyAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;
    private readonly byte[]? _expectedSecretBytes;

    private const string ModerationPathPrefix = "/api/moderation";
    private const string AuthorizationHeader = "Authorization";
    private const string BearerPrefix = "Bearer ";
    private const string WfcSecretConfigKey = "WfcSecret";
    private const string WfcSecretEnvVar = "WFC_SECRET";

    public ApiKeyAuthenticationMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<ApiKeyAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;

        var secret = configuration[WfcSecretConfigKey]
            ?? Environment.GetEnvironmentVariable(WfcSecretEnvVar);

        _expectedSecretBytes = string.IsNullOrEmpty(secret)
            ? null
            : Encoding.UTF8.GetBytes(secret);
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments(ModerationPathPrefix))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(AuthorizationHeader, out StringValues authHeader))
        {
            _logger.LogWarning("Missing Authorization header for moderation endpoint from {IP}",
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { Error = "Missing Authorization header" });
            return;
        }

        if (_expectedSecretBytes == null)
        {
            _logger.LogError("WFC_SECRET is not configured");

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { Error = "Server configuration error" });
            return;
        }

        var headerValue = authHeader.ToString();
        if (!headerValue.StartsWith(BearerPrefix, StringComparison.Ordinal))
        {
            _logger.LogWarning("Malformed Authorization header from {IP}",
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { Error = "Invalid API key" });
            return;
        }

        var token = headerValue.Substring(BearerPrefix.Length);
        var tokenBytes = Encoding.UTF8.GetBytes(token);

        if (!CryptographicOperations.FixedTimeEquals(tokenBytes, _expectedSecretBytes))
        {
            _logger.LogWarning("Invalid API key attempt from {IP}",
                context.Connection.RemoteIpAddress);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { Error = "Invalid API key" });
            return;
        }

        _logger.LogInformation("Authenticated moderation request from {IP}",
            context.Connection.RemoteIpAddress);

        await _next(context);
    }
}
