using MutualFund.Scheme.Application;
using MutualFund.Scheme.Infrastructure;
using MutualFund.Scheme.Infrastructure.Data;
using MutualFund.Scheme.API.Middleware;
using Microsoft.EntityFrameworkCore;
using Serilog;

// ── Bootstrap Serilog ──────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ────────────────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration));

    // ── Application Layers ─────────────────────────────────────────────────
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── API ────────────────────────────────────────────────────────────────
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "MutualFundNav SchemeAPI",
            Version = "v1",
            Description = "Scheme Enrollment, Fund Approval and NAV Comparison API"
        });
    });

    // ── Memory Cache ───────────────────────────────────────────────────────
    builder.Services.AddMemoryCache();

    // ── CORS ───────────────────────────────────────────────────────────────
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? [];

    builder.Services.AddCors(opts =>
        opts.AddPolicy("Default", policy =>
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()));

    var app = builder.Build();

    // ── Database Migration ─────────────────────────────────────────────────
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();
        try
        {
            var canConnect = await db.Database.CanConnectAsync();
            if (canConnect)
                Log.Information("Database connection verified");
            else
                Log.Fatal("Cannot connect to database — check connection string");
        }
        catch (Exception dbEx)
        {
            Log.Warning(dbEx, "Database connectivity check failed — app will still start");
        }
    }

    // ── Middleware Pipeline ────────────────────────────────────────────────
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseCors("Default");

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "MutualFundNav SchemeAPI v1");
        c.RoutePrefix = string.Empty;
    });

    app.UseAuthorization();
    app.MapControllers();

    Log.Information("MutualFundNav SchemeAPI starting on {Env}",
        app.Environment.EnvironmentName);
    Log.Information("Kestrel will bind to: {Urls}", string.Join(", ", app.Urls));

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "MutualFundNav SchemeAPI terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}