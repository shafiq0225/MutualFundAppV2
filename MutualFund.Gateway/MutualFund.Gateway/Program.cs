using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;
using MutualFund.Gateway.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// ── Load ocelot.json ─────────────────────────────────────────────
// Routes stay on localhost for every environment (Development and
// Production alike) since all downstream services run locally.
builder.Configuration
    .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
    .AddJsonFile(
        $"ocelot.{builder.Environment.EnvironmentName}.json",
        optional: true,
        reloadOnChange: true);

// ── JWT Authentication (Gateway validates the token before forwarding) ──
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
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
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

// ── CORS ──────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:4202",
                "http://localhost:4203",
                "http://localhost:4204",
                "http://localhost:4205",
                "https://localhost:7000",
                "https://shafiq0225-mutualfund-shell.shafiqahamed-be.workers.dev",
                "https://shafiq0225-mutualfund-auth.shafiqahamed-be.workers.dev",
                "https://shafiq0225-mutualfund-scheme.shafiqahamed-be.workers.dev",
                "https://shafiq0225-mutualfund-investment.shafiqahamed-be.workers.dev",
                "https://shafiq0225-mutualfund-nav.shafiqahamed-be.workers.dev")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ── Ocelot ────────────────────────────────────────────────────────
if (builder.Environment.IsProduction())
{
    var authHost = Environment.GetEnvironmentVariable("DOWNSTREAM_AUTH_HOST") ?? "mutualfund-auth-api.onrender.com";
    var investmentHost = Environment.GetEnvironmentVariable("DOWNSTREAM_INVESTMENT_HOST") ?? "mutualfund-investment-api.onrender.com";
    var schemeHost = Environment.GetEnvironmentVariable("DOWNSTREAM_SCHEME_HOST") ?? "mutualfund-scheme-api.onrender.com";
    var navHost = Environment.GetEnvironmentVariable("DOWNSTREAM_NAV_HOST") ?? "mutualfund-nav-api.onrender.com";

    foreach (var section in builder.Configuration.GetSection("Routes").GetChildren())
    {
        var downstreamHostPorts = section.GetSection("DownstreamHostAndPorts").GetChildren();
        foreach (var hostPort in downstreamHostPorts)
        {
            var port = hostPort["Port"];
            if (port == "7001")
            {
                hostPort["Host"] = authHost;
                hostPort["Port"] = "443";
                section["DownstreamScheme"] = "https";
                section["HttpHandlerOptions:DangerousAcceptAnyServerCertificateValidator"] = "true";
            }
            else if (port == "7003")
            {
                hostPort["Host"] = investmentHost;
                hostPort["Port"] = "443";
                section["DownstreamScheme"] = "https";
                section["HttpHandlerOptions:DangerousAcceptAnyServerCertificateValidator"] = "true";
            }
            else if (port == "63946")
            {
                hostPort["Host"] = schemeHost;
                hostPort["Port"] = "443";
                section["DownstreamScheme"] = "https";
                section["HttpHandlerOptions:DangerousAcceptAnyServerCertificateValidator"] = "true";
            }
            else if (port == "63944")
            {
                hostPort["Host"] = navHost;
                hostPort["Port"] = "443";
                section["DownstreamScheme"] = "https";
                section["HttpHandlerOptions:DangerousAcceptAnyServerCertificateValidator"] = "true";
            }
        }
    }
}

builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────

// 1 — CORS first
app.UseCors("AllowAll");

// 2 — Gateway request/response logging
app.UseMiddleware<GatewayLoggingMiddleware>();

// 3 — Auth
app.UseAuthentication();
app.UseAuthorization();

// 4 — Ocelot (must be last — handles routing)
await app.UseOcelot();

app.Run();
