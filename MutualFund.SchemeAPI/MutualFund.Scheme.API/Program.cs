using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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

    // ── JWT Authentication ───────────────────────────────────────────────
    // Same SecretKey/Issuer/Audience as MutualFund.AuthAPI — this service
    // only validates tokens AuthAPI issues, it never issues its own.
    var jwtSection = builder.Configuration.GetSection("JwtSettings");
    var secretKey = jwtSection["SecretKey"]!;
    var issuer = jwtSection["Issuer"]!;
    var audience = jwtSection["Audience"]!;

    builder.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme =
                JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme =
                JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // Prevents ASP.NET Core from remapping "role" to the long URI
            // claim type — RequireClaim("role", ...) below depends on the
            // raw "role" claim name AuthAPI's TokenService actually issues.
            options.MapInboundClaims = false;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

    // ── Authorization Policies ───────────────────────────────────────────
    builder.Services.AddAuthorization(options =>
    {
        // NAV Comparison + Scheme Details + Holiday Status: any
        // authenticated user — Admin, Employee, and End User (Head of
        // Family / Members) all see these.
        options.AddPolicy("AllRoles", policy =>
            policy.RequireAuthenticatedUser());

        options.AddPolicy("AdminOnly", policy =>
            policy.RequireClaim("role", "Admin"));

        // Scheme Enrollment feature (view/create/update) + Fund Approval:
        // Admin always passes; an Employee passes only if explicitly
        // granted scheme.manage via AuthAPI's PermissionController. One
        // blanket permission by design — not split into separate
        // read/write/approve grants.
        options.AddPolicy("CanManageSchemeEnrollment", policy =>
            policy.RequireAssertion(ctx =>
                ctx.User.HasClaim("role", "Admin") ||
                ctx.User.HasClaim("permissions", "scheme.manage")));
    });

    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "MutualFundNav SchemeAPI",
            Version = "v1",
            Description = "Scheme Enrollment, Fund Approval and NAV Comparison API"
        });

        var securityScheme = new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Description = "Enter: Bearer {your JWT token}",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            Reference = new OpenApiReference
            {
                Id = JwtBearerDefaults.AuthenticationScheme,
                Type = ReferenceType.SecurityScheme
            }
        };

        c.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            { securityScheme, Array.Empty<string>() }
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

    app.UseAuthentication();
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