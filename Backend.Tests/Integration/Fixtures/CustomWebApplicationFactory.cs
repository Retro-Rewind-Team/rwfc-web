using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace RetroRewindWebsite.Tests.Integration.Fixtures;

internal class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Default matches appsettings.Development.json format; override via env var for CI
    private const string DefaultTestConnectionString =
        "Host=localhost;Database=rr_test;Username=postgres;Password=postgres";

    private readonly Dictionary<string, string?> _configOverrides;

    /// <param name="configOverrides">
    /// Applied after the defaults below, so a test class can vary settings without disturbing the
    /// factory shared by the Integration collection.
    /// </param>
    public CustomWebApplicationFactory(Dictionary<string, string?>? configOverrides = null)
    {
        _configOverrides = configOverrides ?? [];
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use Development so Program.cs picks up ConnectionStrings:DefaultConnection
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    Environment.GetEnvironmentVariable("RR_TEST_CONNECTION_STRING")
                    ?? DefaultTestConnectionString,
                // Known secret used in auth middleware tests
                ["WfcSecret"] = "test-secret-do-not-use-in-prod",
                // Race stats caching off by default so tests always observe freshly seeded data.
                // Tests that exercise the cache itself opt back in via configOverrides.
                ["RaceStatsCache:GlobalSeconds"] = "0",
                ["RaceStatsCache:PlayerSeconds"] = "0"
            });

            if (_configOverrides.Count > 0)
                config.AddInMemoryCollection(_configOverrides);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
        });
    }
}
