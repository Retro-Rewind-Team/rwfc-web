using Microsoft.Extensions.Primitives;

namespace RetroRewindWebsite.Middleware
{
    public class ApiKeyAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;

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
            // Only apply to /api/moderation/* endpoints
            if (context.Request.Path.StartsWithSegments("/api/moderation"))
            {
                if (!context.Request.Headers.TryGetValue("Authorization", out StringValues authHeader))
                {
                    _logger.LogWarning("Missing Authorization header for moderation endpoint");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { Error = "Missing Authorization header" });
                    return;
                }

                var token = authHeader.ToString().Replace("Bearer ", "");
                var expectedSecret = _configuration["WfcSecret"]
                    ?? Environment.GetEnvironmentVariable("WFC_SECRET");

                if (string.IsNullOrEmpty(expectedSecret))
                {
                    _logger.LogError("WFC_SECRET is not configured");
                    context.Response.StatusCode = 500;
                    await context.Response.WriteAsJsonAsync(new { Error = "Server configuration error" });
                    return;
                }

                if (token != expectedSecret)
                {
                    _logger.LogWarning("Invalid API key attempt from {IP}",
                        context.Connection.RemoteIpAddress);
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { Error = "Invalid API key" });
                    return;
                }

                _logger.LogInformation("Authenticated moderation request from {IP}",
                    context.Connection.RemoteIpAddress);
            }

            await _next(context);
        }
    }
}