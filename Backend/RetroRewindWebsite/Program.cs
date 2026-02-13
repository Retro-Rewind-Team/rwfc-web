using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.HealthChecks;
using RetroRewindWebsite.Helpers;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Background;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;
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

builder.Services.AddDbContext<LeaderboardDbContext>(options =>
    options.UseNpgsql(connectionString));

// ===== CACHING =====
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000;
});

// ===== HTTP CLIENT =====
builder.Services.AddHttpClient();

// ===== REPOSITORIES =====
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IVRHistoryRepository, VRHistoryRepository>();
builder.Services.AddScoped<ITimeTrialRepository, TimeTrialRepository>();
builder.Services.AddScoped<IRaceResultRepository, RaceResultRepository>(); // NEW

// ===== EXTERNAL SERVICES =====
builder.Services.AddScoped<IRetroWFCApiClient, RetroWFCApiClient>();

// ===== DOMAIN SERVICES =====
builder.Services.AddScoped<IPlayerValidationService, PlayerValidationService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IMiiService, MiiService>();
builder.Services.AddScoped<IGhostFileService, GhostFileService>();

// ===== APPLICATION SERVICES =====
builder.Services.AddScoped<ILeaderboardManager, LeaderboardManager>();
builder.Services.AddSingleton<IRoomStatusService, RoomStatusService>();
builder.Services.AddScoped<IRaceResultService, RaceResultService>(); // NEW

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

// NEW - Race Results Background Service
builder.Services.AddSingleton<IRaceResultsBackgroundService, RaceResultsBackgroundService>();
builder.Services.AddHostedService<RaceResultsBackgroundService>(sp =>
    (RaceResultsBackgroundService)sp.GetRequiredService<IRaceResultsBackgroundService>());

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

// ===== SWAGGER / OPENAPI =====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' followed by your API key. Example: Bearer your-secret-key"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
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
    app.UseSwagger();
    app.UseSwaggerUI();
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