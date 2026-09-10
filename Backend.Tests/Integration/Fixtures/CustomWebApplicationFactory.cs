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

    /// <summary>The connection string every test host runs against. See the static constructor.</summary>
    internal static string TestConnectionString { get; } =
        Environment.GetEnvironmentVariable("RR_TEST_CONNECTION_STRING") ?? DefaultTestConnectionString;

    static CustomWebApplicationFactory()
    {
        // Program.cs reads ConnectionStrings:DefaultConnection straight off builder.Configuration,
        // and that line runs before the ConfigureAppConfiguration callback below does, so the
        // in-memory override never reached it: every integration test ran against the rr_dev
        // database named in appsettings.json, migrating and truncating it. An environment variable
        // is one of the builder's own default sources, so it lands early enough to win.
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", TestConnectionString);
    }

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
                // Kept alongside the environment variable so the value is visible here too, but the
                // environment variable is what Program.cs actually reads.
                ["ConnectionStrings:DefaultConnection"] = TestConnectionString,
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
