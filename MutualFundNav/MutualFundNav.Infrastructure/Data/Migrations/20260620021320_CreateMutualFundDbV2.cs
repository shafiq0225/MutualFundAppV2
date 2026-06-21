using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MutualFundNav.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CreateMutualFundDbV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobExecutionLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsSuccess = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    Details = table.Column<string>(type: "nvarchar(max)", maxLength: 4096, nullable: true),
                    ElapsedSeconds = table.Column<double>(type: "float", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobExecutionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MarketHolidays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HolidayDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarketHolidays", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NavFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NavDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FileContent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    RecordCount = table.Column<int>(type: "int", nullable: false),
                    Checksum = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    DownloadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsHoliday = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NavFiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobExecutionLogs_StartedAt",
                table: "JobExecutionLogs",
                column: "StartedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MarketHolidays_HolidayDate",
                table: "MarketHolidays",
                column: "HolidayDate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NavFiles_NavDate",
                table: "NavFiles",
                column: "NavDate",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobExecutionLogs");

            migrationBuilder.DropTable(
                name: "MarketHolidays");

            migrationBuilder.DropTable(
                name: "NavFiles");
        }
    }
}
