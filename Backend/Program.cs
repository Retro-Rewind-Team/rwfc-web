using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi;
using Npgsql;
using RetroRewindWebsite.Data;
using RetroRewindWebsite.HealthChecks;
using RetroRewindWebsite.Models.Domain;
using RetroRewindWebsite.Repositories.Multiplier;
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
using System.Net;
using System.Text.Json;

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

// Deliberately small: the host is a 4-thread machine, so more Postgres backends than that buys
// contention rather than throughput. A request now uses one connection at a time (RaceStatsService
// runs its aggregates sequentially), so the four background services plus request traffic fit
// comfortably. Every connection here is a forked backend process on the server.
var csb = new NpgsqlConnectionStringBuilder(connectionString) { MaxPoolSize = 10 };
var dataSourceBuilder = new NpgsqlDataSourceBuilder(csb.ConnectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<LeaderboardDbContext>(options =>
    options.UseNpgsql(dataSource));

// ===== CACHING =====
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000;
});

builder.Services.Configure<RaceStatsCacheOptions>(
    builder.Configuration.GetSection(RaceStatsCacheOptions.SectionName));

// ===== HTTP CLIENT =====
builder.Services.AddHttpClient();

// ===== REPOSITORIES =====
builder.Services.AddScoped<PlayerRepository>();
builder.Services.AddScoped<IPlayerRepository>(sp => sp.GetRequiredService<PlayerRepository>());
builder.Services.AddScoped<IPlayerMiiRepository>(sp => sp.GetRequiredService<PlayerRepository>());
builder.Services.AddScoped<ILegacyPlayerRepository>(sp => sp.GetRequiredService<PlayerRepository>());
builder.Services.AddScoped<IVRHistoryRepository, VRHistoryRepository>();
builder.Services.AddScoped<ITrackRepository, TrackRepository>();
builder.Services.AddScoped<ITTProfileRepository, TTProfileRepository>();
builder.Services.AddScoped<IGhostSubmissionRepository, GhostSubmissionRepository>();
builder.Services.AddScoped<IRaceResultRepository, RaceResultRepository>();
builder.Services.AddScoped<IRoomSnapshotRepository, RoomSnapshotRepository>();
builder.Services.AddScoped<IRaceStatsRepository, RaceStatsRepository>();
builder.Services.AddScoped<IMultiplierRepository, MultiplierRepository>();

// ===== EXTERNAL SERVICES =====
// Typed client with an explicit timeout. The default HttpClient waits 100 seconds, long enough
// for a slow upstream to stall the one-minute sync and hold the room refresh lock.
builder.Services.AddHttpClient<IRetroWFCApiClient, RetroWFCApiClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
});

// ===== DOMAIN SERVICES =====
builder.Services.AddScoped<IPlayerValidationService, PlayerValidationService>();
builder.Services.AddScoped<IDiscordWebhookService, DiscordWebhookService>();
builder.Services.AddSingleton<DiscordAlertQueue>();
builder.Services.AddHttpClient(DiscordWebhookService.DiscordClientName, client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
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
builder.Services.AddScoped<ITimeTrialModerationService, TimeTrialModerationService>();
builder.Services.AddScoped<IMultiplierService, MultiplierService>();
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

builder.Services.AddHostedService<DiscordAlertBackgroundService>();

// ===== HEALTH CHECKS =====
builder.Services.AddHealthChecks()
    // Checks connectivity through the shared data source, so it costs no extra connections.
    // A second AddNpgSql check used to sit here; it only accepts a connection string, and Npgsql
    // pools per connection string, so it opened an independent pool and the process could hold up
    // to twice MaxPoolSize backends. It tested nothing this check does not.
    .AddDbContextCheck<LeaderboardDbContext>()
    .AddCheck<ExternalApiHealthCheck>("retro-wfc-api")
    .AddCheck("memory", () =>
    {
        var memoryUsed = GC.GetTotalMemory(forceFullCollection: false);
        const long memoryLimitBytes = 500L * 1024 * 1024; // 500MB

        return memoryUsed < memoryLimitBytes
            ? HealthCheckResult.Healthy($"Memory usage: {memoryUsed / 1024 / 1024}MB")
            : HealthCheckResult.Unhealthy($"High memory usage: {memoryUsed / 1024 / 1024}MB");
    });

// ===== FORWARDED HEADERS =====
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
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
app.UseForwardedHeaders();
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
        throw;
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

