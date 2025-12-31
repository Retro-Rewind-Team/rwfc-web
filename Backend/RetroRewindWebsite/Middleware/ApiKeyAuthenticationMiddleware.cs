using Microsoft.Extensions.Primitives;

namespace RetroRewindWebsite.Middleware
{
    public class ApiKeyAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;

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
            _configuration = configuration;
            _logger = logger;
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

            var token = authHeader.ToString().Replace(BearerPrefix, "");
            var expectedSecret = _configuration[WfcSecretConfigKey]
                ?? Environment.GetEnvironmentVariable(WfcSecretEnvVar);

            if (string.IsNullOrEmpty(expectedSecret))
            {
                _logger.LogError("WFC_SECRET is not configured");

                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new { Error = "Server configuration error" });
                return;
            }

            if (token != expectedSecret)
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
}