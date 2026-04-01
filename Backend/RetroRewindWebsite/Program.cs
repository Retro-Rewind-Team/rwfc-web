using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;
using Npgsql;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.HealthChecks;
using RetroRewindWebsite.Repositories.Player;
using RetroRewindWebsite.Repositories.RaceResult;
using RetroRewindWebsite.Repositories.Room;
using RetroRewindWebsite.Repositories.TimeTrial;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Background;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;
using Scalar.AspNetCore;
using Serilog;
using System.Text.Json;
using System.Threading.RateLimiting;

// Disable IPv6 to prevent connectivity issues with external Mii image API
AppContext.SetSwitch("System.Net.DisableIPv6", true);

var builder = WebApplication.CreateBuilder(args);

// ===== LOGGING =====
builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext();
});

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        }
        else
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    });
});

// ===== DATABASE =====
var connectionString = builder.Environment.IsDevelopment()
    ? builder.Configuration.GetConnectionString("DefaultConnection")
    : Environment.GetEnvironmentVariable("CONNECTION_STRING")
      ?? builder.Configuration.GetConnectionString("Production");

if (string.IsNullOrEmpty(connectionString))
{
    var environment = builder.Environment.IsDevelopment() ? "Development" : "Production";
    throw new InvalidOperationException($"{environment} connection string is not configured.");
}

var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<LeaderboardDbContext>(options =>
    options.UseNpgsql(dataSource));

// ===== CACHING =====
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000;
});

// ===== HTTP CLIENT =====
builder.Services.AddHttpClient();

// ===== REPOSITORIES =====
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IPlayerMiiRepository, PlayerRepository>();
builder.Services.AddScoped<ILegacyPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IVRHistoryRepository, VRHistoryRepository>();
builder.Services.AddScoped<ITrackRepository, TrackRepository>();
builder.Services.AddScoped<ITTProfileRepository, TTProfileRepository>();
builder.Services.AddScoped<IGhostSubmissionRepository, GhostSubmissionRepository>();
builder.Services.AddScoped<IRaceResultRepository, RaceResultRepository>();
builder.Services.AddScoped<IRoomSnapshotRepository, RoomSnapshotRepository>();
builder.Services.AddScoped<IRaceStatsRepository, RaceStatsRepository>();

// ===== EXTERNAL SERVICES =====
builder.Services.AddScoped<IRetroWFCApiClient, RetroWFCApiClient>();

// ===== DOMAIN SERVICES =====
builder.Services.AddScoped<IPlayerValidationService, PlayerValidationService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IMiiService, MiiService>();
builder.Services.AddScoped<IGhostFileService, GhostFileService>();

// ===== APPLICATION SERVICES =====
builder.Services.AddScoped<ILeaderboardService, LeaderboardService>();
builder.Services.AddScoped<ILeaderboardSyncService, LeaderboardSyncService>();
builder.Services.AddScoped<IMiiBatchService, MiiBatchService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<IPlayerModerationService, PlayerModerationService>();
builder.Services.AddScoped<ITimeTrialService, TimeTrialService>();
builder.Services.AddSingleton<IRoomStatusService, RoomStatusService>();
builder.Services.AddScoped<IRaceResultService, RaceResultService>();
builder.Services.AddScoped<IRaceStatsService, RaceStatsService>();

// ===== BACKGROUND SERVICES =====
builder.Services.AddSingleton<ILeaderboardBackgroundService, LeaderboardBackgroundService>();
builder.Services.AddHostedService<LeaderboardBackgroundService>(sp =>
    (LeaderboardBackgroundService)sp.GetRequiredService<ILeaderboardBackgroundService>());

builder.Services.AddSingleton<IMiiPreFetchBackgroundService, MiiPreFetchBackgroundService>();
builder.Services.AddHostedService<MiiPreFetchBackgroundService>(sp =>
    (MiiPreFetchBackgroundService)sp.GetRequiredService<IMiiPreFetchBackgroundService>());

builder.Services.AddSingleton<IRoomStatusBackgroundService, RoomStatusBackgroundService>();
builder.Services.AddHostedService<RoomStatusBackgroundService>(sp =>
    (RoomStatusBackgroundService)sp.GetRequiredService<IRoomStatusBackgroundService>());

builder.Services.AddSingleton<IRaceResultBackgroundService, RaceResultBackgroundService>();
builder.Services.AddHostedService<RaceResultBackgroundService>(sp =>
    (RaceResultBackgroundService)sp.GetRequiredService<IRaceResultBackgroundService>());

// ===== HEALTH CHECKS =====
builder.Services.AddHealthChecks()
    .AddDbContextCheck<LeaderboardDbContext>()
    .AddNpgSql(connectionString)
    .AddCheck<ExternalApiHealthCheck>("retro-wfc-api")
    .AddCheck("memory", () =>
    {
        var memoryUsed = GC.GetTotalMemory(forceFullCollection: false);
        const long memoryLimitBytes = 500L * 1024 * 1024; // 500MB

        return memoryUsed < memoryLimitBytes
            ? HealthCheckResult.Healthy($"Memory usage: {memoryUsed / 1024 / 1024}MB")
            : HealthCheckResult.Unhealthy($"High memory usage: {memoryUsed / 1024 / 1024}MB");
    });

builder.Services.AddScoped<IHealthCheck, ExternalApiHealthCheck>();

// ===== RATE LIMITING =====
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 2000,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("RefreshPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("DownloadPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 3,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("GhostDownloadPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Configure rejection behavior when rate limit is exceeded
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = retryAfter.TotalSeconds.ToString();
        }

        await context.HttpContext.Response.WriteAsync(
            "Rate limit exceeded. Please try again later.", token);
    };
});

// ===== CONTROLLERS =====
builder.Services.AddControllers();

// ===== OPENAPI / SCALAR =====
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Components ??= new();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your API key as a Bearer token."
        };
        return Task.CompletedTask;
    });
});

// ===== BUILD APP =====
var app = builder.Build();

// ===== MIDDLEWARE PIPELINE =====
app.UseCors("AllowFrontend");
app.UseMiddleware<RetroRewindWebsite.Middleware.ApiKeyAuthenticationMiddleware>();

// ===== DATABASE MIGRATIONS =====
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LeaderboardDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Applying database migrations...");
        dbContext.Database.Migrate();
        logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while applying migrations");

        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// ===== HEALTH CHECK ENDPOINTS =====
app.MapHealthChecks("api/health", new HealthCheckOptions
{
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("api/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

app.MapHealthChecks("api/health/ready");

// ===== CONFIGURE PIPELINE =====
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Only redirect to HTTPS in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ===== HELPER METHODS =====
static async Task WriteHealthCheckResponse(HttpContext context, HealthReport report)
{
    context.Response.ContentType = "application/json";

    var response = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString(),
            description = entry.Value.Description,
            duration = entry.Value.Duration.TotalMilliseconds
        }),
        totalDuration = report.TotalDuration.TotalMilliseconds
    };

    await context.Response.WriteAsync(JsonSerializer.Serialize(response));
}
