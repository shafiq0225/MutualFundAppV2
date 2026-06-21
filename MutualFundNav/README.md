# MutualFundNav

ASP.NET Core 8 Web API that downloads AMFI mutual fund NAV data daily,
stores it in **MutualFundDbV2** (SQL Server), and publishes events to **Kafka**.

## Solution structure

```
MutualFundNav/
├── MutualFundNav.Domain/           # Entities, interfaces, contracts, enums — no dependencies
│   ├── Common/Result.cs
│   ├── Contracts/                  # Kafka event schemas
│   ├── Entities/                   # NavFile, MarketHoliday, JobExecutionLog
│   ├── Enums/DownloadStatus.cs
│   └── Interfaces/                 # IUnitOfWork, INavFileRepository, IKafkaPublisher<T>, ...
│
├── MutualFundNav.Application/      # Use cases — depends on Domain only
│   └── UseCases/Commands/DownloadAndStoreNavCommand.cs
│
├── MutualFundNav.Infrastructure/   # EF Core, Kafka, HTTP services — depends on Application
│   ├── Data/                       # ApplicationDbContext, UnitOfWork, DbContextFactory
│   ├── Helpers/DateHelper.cs
│   ├── Repositories/               # NavFile, MarketHoliday, JobExecutionLog repos
│   └── Services/                   # NavDownloadService, NseHolidayFetcher, KafkaPublisher<T>
│
└── MutualFundNav.API/              # ASP.NET Core host — depends on Application + Infrastructure
    ├── Controllers/                # NavController, JobsController, HolidaysController
    ├── Workers/NavDownloadWorker.cs # BackgroundService — runs daily at ScheduleTime
    ├── Middleware/GlobalExceptionMiddleware.cs
    ├── Extensions/SwaggerExtensions.cs
    ├── Program.cs
    └── appsettings.json
```

## Quick start

### 1. Prerequisites
- .NET 8 SDK
- SQL Server (local or Azure SQL)
- Kafka (local via Docker or Confluent Cloud)

### 2. Configure connection strings

Edit `MutualFundNav.API/appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MutualFundDbV2;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092"
  }
}
```

### 3. Run EF Core migration (creates MutualFundDbV2)

```bash
cd MutualFundNav.Infrastructure

dotnet ef migrations add InitialCreate \
  --startup-project ../MutualFundNav.API \
  --output-dir Data/Migrations

dotnet ef database update \
  --startup-project ../MutualFundNav.API
```

### 4. Run the API

```bash
cd MutualFundNav.API
dotnet run
```

Swagger UI opens at: http://localhost:5000

### 5. Kafka topics to create

```bash
# Create topics (adjust replication-factor for production)
kafka-topics --bootstrap-server localhost:9092 --create \
  --topic nav-file-processed --partitions 3 --replication-factor 1

kafka-topics --bootstrap-server localhost:9092 --create \
  --topic market-holidays --partitions 1 --replication-factor 1
```

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/nav/trigger` | Trigger NAV download for last trading date |
| POST | `/api/nav/trigger/{date}` | Trigger download for a specific date |
| GET | `/api/nav/target-date` | Get the current target NAV date |
| GET | `/api/nav/latest` | Get latest stored NAV date |
| GET | `/api/nav/dates` | List all stored NAV dates |
| GET | `/api/jobs/logs` | Recent job execution logs |
| GET | `/api/jobs/logs/latest` | Most recent job log |
| GET | `/api/holidays/is-trading-day?date=` | Check if a date is a trading day |
| POST | `/api/holidays/refresh` | Force-refresh NSE holiday cache |
| GET | `/api/holidays/{year}` | List holidays for a year |
| GET | `/health` | Health check (SQL Server connectivity) |

## Database: MutualFundDbV2

Three tables created by EF Core migration:

| Table | Purpose |
|-------|---------|
| `NavFiles` | Stores downloaded NAV file content per trading date |
| `MarketHolidays` | NSE market holidays (populated by NseHolidayFetcher) |
| `JobExecutionLogs` | Audit trail for every scheduler run |

## Kafka topics

| Topic | Key | Event |
|-------|-----|-------|
| `nav-file-processed` | `yyyy-MM-dd` | `NavFileProcessedEvent` — full NAV data |
| `market-holidays` | `yyyy-MM-dd` | `MarketHolidayEvent` — holiday notification |

## Deploy as Windows Service

```bash
dotnet publish -c Release -o C:\Publish\MutualFundNav
sc create "MutualFundNav API" binPath="C:\Publish\MutualFundNav\MutualFundNav.API.exe"
sc start "MutualFundNav API"
```
