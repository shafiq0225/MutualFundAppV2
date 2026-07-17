using MutualFund.Investment.API.Extensions;
using MutualFund.Investment.API.Middleware;
using MutualFund.Investment.Application;
using MutualFund.Investment.Infrastructure;
using MutualFund.Investment.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Serilog ───────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// ── Application + Infrastructure ──────────────────────────────────
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ── JWT Authentication ─────────────────────────────────────────────
builder.Services.AddJwtAuthentication(builder.Configuration, builder.Environment);

// ── Controllers ───────────────────────────────────────────────────
builder.Services.AddControllers();

// ── Swagger ───────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "MutualFund Investment API",
        Version = "v1",
        Description = "Investment Orders, Portfolio P&L, Statements"
    });

    c.AddSecurityDefinition("Bearer", new()
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer {your token}"
    });

    c.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new()
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── CORS ──────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// ── Auto-migrate ──────────────────────────────────────────────────
// ── Safe Migration (Only in Development OR if DB exists) ───────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<InvestmentDbContext>();

    try
    {
        if (app.Environment.IsDevelopment())
        {
            db.Database.Migrate();
            Log.Information("Migration applied in Development");
        }
        else
        {
            if (db.Database.CanConnect())
            {
                db.Database.Migrate();
                Log.Information("Migration applied in Production (DB exists)");
            }
            else
            {
                Log.Warning("Database not reachable. Skipping migration.");
            }
        }
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Migration failed. Skipping to avoid app crash.");
    }
}

// ── Middleware Pipeline ───────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();

// ── Swagger (Enabled in all environments) ─────────────────────────
app.UseSwagger();

app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MutualFund Investment API v1");
    c.RoutePrefix = "swagger"; // optional (default is already "swagger")
});

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Log.Information(
    "MutualFund Investment API started on port 7003");
app.Run();