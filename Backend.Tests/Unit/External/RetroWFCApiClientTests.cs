using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RetroRewindWebsite.Services.External;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.External;

/// <summary>
/// WFC only creates a room's race results URL once its first race finishes, so a 404 is the normal
/// answer for a new room or one that closed without racing. Logging it as an error put thousands of
/// stack traces a day into the error log.
/// </summary>
[Trait("Category", "Unit")]
public class RetroWFCApiClientTests
{
    [Fact]
    public async Task TreatsANotFoundRoomAsHavingNoResultsYet()
    {
        var logger = new RecordingLogger();
        var client = CreateClient(HttpStatusCode.NotFound, logger);

        var results = await client.GetRoomRaceResultsAsync("ABCDEF", TestContext.Current.CancellationToken);

        results.ShouldBeEmpty();
        logger.Levels.ShouldNotContain(level => level >= LogLevel.Warning);
    }

    [Fact]
    public async Task StillLogsOtherHttpFailuresAsErrors()
    {
        var logger = new RecordingLogger();
        var client = CreateClient(HttpStatusCode.InternalServerError, logger);

        var results = await client.GetRoomRaceResultsAsync("ABCDEF", TestContext.Current.CancellationToken);

        results.ShouldBeEmpty();
        logger.Levels.ShouldContain(LogLevel.Error);
    }

    private static RetroWFCApiClient CreateClient(HttpStatusCode status, RecordingLogger logger) =>
        new(new HttpClient(new StubHandler(status)), new ConfigurationBuilder().Build(), logger);

    private sealed class StubHandler(HttpStatusCode status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(status));
    }

    private sealed class RecordingLogger : ILogger<RetroWFCApiClient>
    {
        public List<LogLevel> Levels { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Levels.Add(logLevel);
    }
}
