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
                ["WfcSecret"] = "test-secret-do-not-use-in-prod"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
        });
    }
}
