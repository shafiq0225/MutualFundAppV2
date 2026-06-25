using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MutualFundNav.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "KafkaPublishLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Topic = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    MessageKey = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    MessageSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    IsSuccess = table.Column<bool>(type: "bit", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ElapsedMs = table.Column<double>(type: "float", nullable: false),
                    TriggerSource = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    NavDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Partition = table.Column<int>(type: "int", nullable: true),
                    Offset = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KafkaPublishLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_KafkaPublishLogs_IsSuccess",
                table: "KafkaPublishLogs",
                column: "IsSuccess");

            migrationBuilder.CreateIndex(
                name: "IX_KafkaPublishLogs_NavDate",
                table: "KafkaPublishLogs",
                column: "NavDate");

            migrationBuilder.CreateIndex(
                name: "IX_KafkaPublishLogs_PublishedAt",
                table: "KafkaPublishLogs",
                column: "PublishedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "KafkaPublishLogs");
        }
    }
}
