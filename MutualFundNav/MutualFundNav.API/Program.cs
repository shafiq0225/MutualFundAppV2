using MutualFundNav.Application;
using MutualFundNav.Infrastructure;
using MutualFundNav.Infrastructure.Data;
using MutualFundNav.API.Extensions;
using MutualFundNav.API.Middleware;
using MutualFundNav.API.Workers;
using Serilog;

// ── Bootstrap Serilog immediately so startup errors are captured ───────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Windows Service support ─────────────────────────────────────────
    builder.Host.UseWindowsService(opts =>
        opts.ServiceName = "MutualFundNav API");

    // ── Serilog (full config from appsettings) ──────────────────────────
    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration));

    // ── Application Layers ──────────────────────────────────────────────
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── API Infrastructure ──────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerDocs();

    // ── Health Checks ───────────────────────────────────────────────────
    builder.Services
        .AddHealthChecks()
        .AddDbContextCheck<ApplicationDbContext>("sql-server");

    // ── Scheduled Worker ────────────────────────────────────────────────
    builder.Services.AddHostedService<NavDownloadWorker>();

    // ── CORS (tighten in production) ────────────────────────────────────
    builder.Services.AddCors(opts =>
        opts.AddPolicy("Default", policy =>
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

    var app = builder.Build();

    // ── Database initialisation ─────────────────────────────────────────
    // Guard: skip DB check when EF design-time tooling is running the host
    // (dotnet ef migrations add / database update). Without this guard,
    // CanConnectAsync() throws HostAbortedException and blocks migration scaffolding.
    // EF design-time tooling injects "--applicationName" when it boots the host.
    // Detect it and skip the live DB check to avoid HostAbortedException.
    bool isDesignTime = args.Any(a =>
        a.Contains("--applicationName", StringComparison.OrdinalIgnoreCase));

    if (!isDesignTime)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try
        {
            var canConnect = await db.Database.CanConnectAsync();
            if (canConnect)
                Log.Information("Database 'MutualFundDbV2' connection verified");
            else
                Log.Fatal("Cannot connect to 'MutualFundDbV2' — check connection string");
        }
        catch (Exception dbEx)
        {
            Log.Warning(dbEx, "Database connectivity check failed — app will still start");
        }
    }

    // ── Middleware Pipeline ─────────────────────────────────────────────
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors("Default");

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "MutualFundNav API v1");
            c.RoutePrefix = string.Empty; // Swagger at root
        });
    }

    app.UseHttpsRedirection();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");

    Log.Information("MutualFundNav API starting on {Env}", app.Environment.EnvironmentName);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "MutualFundNav API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
