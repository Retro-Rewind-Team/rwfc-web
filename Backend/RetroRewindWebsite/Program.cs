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
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext();
});

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

builder.Services.AddRateLimiter(options =>
{
    // Default policy - 100 requests per minute per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        httpContext => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Specific policies for different endpoints
    options.AddPolicy("SearchPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 50, // More restrictive for search
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy("RefreshPolicy", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5, // Very restrictive for admin operations
                Window = TimeSpan.FromMinutes(1)
            }));

    // What to do when rate limit is exceeded
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429; // Too Many Requests
        await context.HttpContext.Response.WriteAsync("Rate limit exceeded. Please try again later.", token);
    };
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<LeaderboardDbContext>() // Check if EF can connect
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!) // Direct DB check
    .AddCheck<ExternalApiHealthCheck>("retro-wfc-api") // Custom check for external API
    .AddCheck("memory", () =>
    {
        // Check if memory usage is reasonable
        var memoryUsed = GC.GetTotalMemory(false);
        var memoryLimitMB = 1024 * 1024 * 500; // 500MB limit

        return memoryUsed < memoryLimitMB
            ? HealthCheckResult.Healthy($"Memory usage: {memoryUsed / 1024 / 1024}MB")
            : HealthCheckResult.Unhealthy($"High memory usage: {memoryUsed / 1024 / 1024}MB");
    });

// Add services to the container.
builder.Services.AddControllers();

// Configure DbContext for different environments
if (builder.Environment.IsDevelopment())
{
    // Use PostgreSQL for development
    var devConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<LeaderboardDbContext>(options =>
        options.UseNpgsql(devConnectionString));
}
else
{
    // Use PostgreSQL for production
    var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
        ?? builder.Configuration.GetConnectionString("Production");

    if (string.IsNullOrEmpty(connectionString))
    {
        throw new InvalidOperationException("Production connection string is not set.");
    }

    builder.Services.AddDbContext<LeaderboardDbContext>(options =>
        options.UseNpgsql(connectionString));
}

// Register HttpClient for external API calls
builder.Services.AddHttpClient();

// Register repositories
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IVRHistoryRepository, VRHistoryRepository>();

// Register external services
builder.Services.AddScoped<IRetroWFCApiClient, RetroWFCApiClient>();

// Register domain services
builder.Services.AddScoped<IPlayerValidationService, PlayerValidationService>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();
builder.Services.AddScoped<IMiiService, MiiService>();
builder.Services.AddMemoryCache();

// Register background service
builder.Services.AddHostedService<LeaderboardBackgroundService>();
builder.Services.AddScoped<ILeaderboardBackgroundService, LeaderboardBackgroundService>();

// Register application services
builder.Services.AddScoped<ILeaderboardManager, LeaderboardManager>();
builder.Services.AddScoped<IGroupsExManager, GroupsExManager>();

// Register health checks
builder.Services.AddScoped<IHealthCheck, ExternalApiHealthCheck>();

// Add memory cache for performance
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000; // Limit to 1000 items in cache
});

// Add Swagger/OpenAPI support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowFrontend");

// Apply migrations automatically on startup
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
        // In development, you might want to throw, but in production continue
        if (app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

// Health check endpoints
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
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

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
});

// Simple health check endpoint (just returns 200 OK)
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false // Don't run any checks, just return 200
});

// Detailed health check (includes all checks)
app.MapHealthChecks("/health/ready");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.UseRateLimiter();

app.Run();
