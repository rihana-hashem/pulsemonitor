using FastEndpoints;
using FastEndpoints.Swagger;
using FluentValidation;
using System.Text.Json;
using System.Text.Json.Serialization;
using Hangfire;
using PulseMonitor.Infrastructure;
using PulseMonitor.Application;
using PulseMonitor.Infrastructure.BackgroundJobs;
using PulseMonitor.Api.Auth;
using PulseMonitor.Api.HealthChecks;
using PulseMonitor.Api.Hubs;
using PulseMonitor.Application.Monitoring;
using Microsoft.AspNetCore.SignalR;
using PulseMonitor.Api.Middleware;
using PulseMonitor.Infrastructure.HealthChecks;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Serilog;
using Serilog.Events;

// Bootstrap logger captures startup failures before configuration is loaded.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddSerilog(loggerConfiguration => loggerConfiguration
        .ReadFrom.Configuration(builder.Configuration)
        .Enrich.FromLogContext());

    // Add services to the container.
    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddApplication(builder.Configuration);
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddJwtAuthentication();

    // Real-time push (see Hubs/MonitoringHub.cs).
    builder.Services.AddSignalR();
    builder.Services.AddSingleton<IUserIdProvider, SubjectUserIdProvider>();
    builder.Services.AddSingleton<PresenceTracker>();
    builder.Services.AddSingleton<IMonitoringNotifier, SignalRMonitoringNotifier>();
    builder.Services.AddHangfireServer(options =>
    {
        options.WorkerCount = 2;
    });
    // Name properties in validation messages exactly as clients send them ("serverName"),
    // instead of FluentValidation's split form ("server Name").
    ValidatorOptions.Global.DisplayNameResolver = (_, member, _) =>
        member is null ? null : JsonNamingPolicy.CamelCase.ConvertName(member.Name);

    builder.Services
        .AddFastEndpoints()
        // One Swagger document per API release. A future v2 document would set
        // MaxEndpointVersion = 2 and include every endpoint up to version 2.
        .SwaggerDocument(options =>
        {
            options.MaxEndpointVersion = 1;
            // Tag by the first segment of the endpoint's own route ("/servers" -> "Servers");
            // the "api" prefix and version segment are not counted.
            options.AutoTagPathSegmentIndex = 1;
            options.ShortSchemaNames = true;
            // Document enums by name ("createdAt"), matching what the API accepts and returns.
            options.SerializerSettings = settings =>
                settings.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
            options.DocumentSettings = settings =>
            {
                settings.DocumentName = "v1";
                settings.Title = "PulseMonitor API";
                settings.Version = "v1";
                settings.Description = "Server monitoring, metrics, alerts and reports.";
            };
        });

    var app = builder.Build();

    app.Services
        .GetRequiredService<IRecurringJobManager>()
        .RegisterRecurringJobs();

    // Configure the HTTP request pipeline.
    // Outermost, so it logs the final status code after the exception handler has run.
    app.UseSerilogRequestLogging(options =>
    {
        options.GetLevel = (httpContext, _, exception) =>
            exception is not null || httpContext.Response.StatusCode >= 500
                ? LogEventLevel.Error
                // The Hangfire dashboard and health probes poll every few seconds;
                // keep them out of normal logs.
                : httpContext.Request.Path.StartsWithSegments("/hangfire") ||
                  httpContext.Request.Path.StartsWithSegments("/health")
                    ? LogEventLevel.Verbose
                    : LogEventLevel.Information;

        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("ClientIp", httpContext.Connection.RemoteIpAddress?.ToString());
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
        };
    });

    // Must run before everything else below so it catches their exceptions.
    app.UseExceptionHandler();
    app.UseStatusCodePages();

    app.UseHttpsRedirection();
    if (app.Environment.IsDevelopment())
    {
        app.UseHangfireDashboard("/hangfire");
    }

    // Endpoints are protected per endpoint with Roles(...); AllowAnonymous() opts out.
    app.UseAuthentication();
    app.UseAuthorization();

    // Routes become /api/v{version}/{endpoint route}, e.g. /api/v1/servers.
    app.UseFastEndpoints(config =>
    {
        config.Endpoints.RoutePrefix = "api";
        config.Versioning.Prefix = "v";
        config.Versioning.DefaultVersion = 1;
        config.Versioning.PrependToRoute = true;
        // Validation failures (400) use the same RFC 7807 format as GlobalExceptionHandler.
        config.Errors.UseProblemDetails();
        // Enums are sent and received as camelCase names, not numbers.
        config.Serializer.Options.Converters.Add(
            new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

    app.MapHub<MonitoringHub>(MonitoringHub.Path);

    // Liveness: the process is up and responding. Runs no checks, so a database
    // outage never makes an orchestrator restart a healthy process.
    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false,
        ResponseWriter = HealthCheckResponseWriter.WriteAsync
    });

    // Readiness: dependencies are reachable and the instance can take traffic.
    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains(HealthCheckTags.Ready),
        ResponseWriter = HealthCheckResponseWriter.WriteAsync
    });

    if (app.Environment.IsDevelopment())
    {
        // Serves /swagger (UI) and /swagger/v1/swagger.json; must come after UseFastEndpoints.
        app.UseSwaggerGen();
    }

    app.Run();
}
// HostAbortedException is thrown on purpose by design-time tools such as dotnet-ef.
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "PulseMonitor API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
