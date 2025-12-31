using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.HealthChecks;
using RetroRewindWebsite.Repositories;
using RetroRewindWebsite.Services.Application;
using RetroRewindWebsite.Services.Background;
using RetroRewindWebsite.Services.Domain;
using RetroRewindWebsite.Services.External;
using Serilog;
using System.Text.Json;
using System.Threading.RateLimiting;

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

// ===== RATE LIMITING =====
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1)
            }));

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

// ===== HEALTH CHECKS =====
builder.Services.AddHealthChecks()
    .AddDbContextCheck<LeaderboardDbContext>()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
    .AddCheck<ExternalApiHealthCheck>("retro-wfc-api")
    .AddCheck("memory", () =>
    {
        var memoryUsed = GC.GetTotalMemory(forceFullCollection: false);
        const long memoryLimitBytes = 500L * 1024 * 1024; // 500MB

        return memoryUsed < memoryLimitBytes
            ? HealthCheckResult.Healthy($"Memory usage: {memoryUsed / 1024 / 1024}MB")
            : HealthCheckResult.Unhealthy($"High memory usage: {memoryUsed / 1024 / 1024}MB");
    });

// ===== CONTROLLERS =====
builder.Services.AddControllers();

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

// ===== HTTP CLIENT =====
builder.Services.AddHttpClient();

// ===== REPOSITORIES =====
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IVRHistoryRepository, VRHistoryRepository>();

// ===== EXTERNAL SERVICES =====
builder.Services.AddScoped<IRetroWFCApiClient, RetroWFCApiClient>();

// ===== DOMAIN SERVICES =====
builder.Services.AddScoped<IPlayerValidationService, PlayerValidationService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IMiiService, MiiService>();

// ===== APPLICATION SERVICES =====
builder.Services.AddScoped<ILeaderboardManager, LeaderboardManager>();
builder.Services.AddSingleton<IRoomStatusService, RoomStatusService>();

// ===== CACHING =====
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000;
});

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

// ===== HEALTH CHECK IMPLEMENTATIONS =====
builder.Services.AddScoped<IHealthCheck, ExternalApiHealthCheck>();

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
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = WriteHealthCheckResponse
});

app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});

app.MapHealthChecks("/health/ready");

// ===== CONFIGURE PIPELINE =====
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
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