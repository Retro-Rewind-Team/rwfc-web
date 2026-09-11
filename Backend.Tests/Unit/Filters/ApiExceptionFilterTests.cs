using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging.Abstractions;
using RetroRewindWebsite.Filters;
using Shouldly;
using Xunit;

namespace RetroRewindWebsite.Tests.Unit.Filters;

/// <summary>
/// This filter replaced 59 hand-written try/catch blocks, so every controller action now depends
/// on it to turn a fault into a 500 rather than letting it escape as an unhandled exception.
/// </summary>
public class ApiExceptionFilterTests
{
    [Fact]
    public async Task TurnsAnUnhandledExceptionIntoA500()
    {
        var context = ExceptionContextFor(new InvalidOperationException("boom"));

        await Filter().OnExceptionAsync(context);

        context.ExceptionHandled.ShouldBeTrue();
        var result = context.Result.ShouldBeOfType<ObjectResult>();
        result.StatusCode.ShouldBe(StatusCodes.Status500InternalServerError);
    }

    [Fact]
    public async Task DoesNotLeakTheExceptionMessageToTheCaller()
    {
        var context = ExceptionContextFor(new InvalidOperationException("connection string: secret"));

        await Filter().OnExceptionAsync(context);

        var result = context.Result.ShouldBeOfType<ObjectResult>();
        (result.Value?.ToString() ?? string.Empty).ShouldNotContain("secret");
    }

    [Fact]
    public async Task LeavesAnAlreadyHandledExceptionAlone()
    {
        // Another filter may have dealt with it and set its own result; do not overwrite that.
        var context = ExceptionContextFor(new InvalidOperationException("boom"));
        var existing = new OkResult();
        context.ExceptionHandled = true;
        context.Result = existing;

        await Filter().OnExceptionAsync(context);

        context.Result.ShouldBeSameAs(existing);
    }

    [Fact]
    public async Task TreatsAClientHangUpAsHandledWithoutProducingA500()
    {
        // Nobody is left to receive a response, and an aborted request is not a server fault.
        var context = ExceptionContextFor(new OperationCanceledException(), clientAborted: true);

        await Filter().OnExceptionAsync(context);

        context.ExceptionHandled.ShouldBeTrue();
        context.Result.ShouldBeNull();
    }

    [Fact]
    public async Task StillReportsACancellationThatDidNotComeFromTheClient()
    {
        // An internal timeout surfaces as the same exception type, but it is a real fault.
        var context = ExceptionContextFor(new OperationCanceledException(), clientAborted: false);

        await Filter().OnExceptionAsync(context);

        var result = context.Result.ShouldBeOfType<ObjectResult>();
        result.StatusCode.ShouldBe(StatusCodes.Status500InternalServerError);
    }

    private static ApiExceptionFilter Filter() =>
        new(NullLogger<ApiExceptionFilter>.Instance);

    private static ExceptionContext ExceptionContextFor(Exception exception, bool clientAborted = false)
    {
        var httpContext = new DefaultHttpContext();
        if (clientAborted)
            httpContext.RequestAborted = new CancellationToken(canceled: true);

        var actionContext = new ActionContext(
            httpContext,
            new RouteData(),
            new ActionDescriptor { DisplayName = "TestController.TestAction" });

        return new ExceptionContext(actionContext, []) { Exception = exception };
    }
}
