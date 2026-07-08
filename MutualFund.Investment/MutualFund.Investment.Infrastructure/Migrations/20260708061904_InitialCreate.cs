using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MutualFund.Investment.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InvestmentOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    InvestorUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    InvestorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SchemeCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SchemeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FundName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    InvestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ChequeNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ChequeDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TransactionRef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    OrderDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AssignedStaffName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SubmittedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    VerifiedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VerifiedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true),
                    PurchaseNAV = table.Column<decimal>(type: "decimal(18,4)", nullable: true),
                    UnitsAllotted = table.Column<decimal>(type: "decimal(18,6)", nullable: true),
                    FolioNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ActivatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestmentOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Holdings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    InvestorUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    InvestorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SchemeCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SchemeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FundName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    FolioNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PurchaseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PurchaseNAV = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    InvestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Units = table.Column<decimal>(type: "decimal(18,6)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holdings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Holdings_InvestmentOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "InvestmentOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InvestmentStatements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    InvestorUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    InvestorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StatementDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedByUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvestmentStatements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvestmentStatements_InvestmentOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "InvestmentOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PortfolioSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    HoldingId = table.Column<int>(type: "int", nullable: false),
                    InvestorUserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    InvestorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SchemeCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SchemeName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FundName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    SnapshotDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CurrentNAV = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    InvestedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProfitLoss = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProfitLossPercent = table.Column<decimal>(type: "decimal(10,4)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortfolioSnapshots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PortfolioSnapshots_Holdings_HoldingId",
                        column: x => x.HoldingId,
                        principalTable: "Holdings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_InvestorUserId",
                table: "Holdings",
                column: "InvestorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_InvestorUserId_IsActive",
                table: "Holdings",
                columns: new[] { "InvestorUserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_IsActive",
                table: "Holdings",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_OrderId",
                table: "Holdings",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_SchemeCode",
                table: "Holdings",
                column: "SchemeCode");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentOrders_InvestorUserId",
                table: "InvestmentOrders",
                column: "InvestorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentOrders_OrderDate",
                table: "InvestmentOrders",
                column: "OrderDate");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentOrders_OrderNumber",
                table: "InvestmentOrders",
                column: "OrderNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentOrders_SchemeCode",
                table: "InvestmentOrders",
                column: "SchemeCode");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentOrders_Status",
                table: "InvestmentOrders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentStatements_InvestorUserId",
                table: "InvestmentStatements",
                column: "InvestorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InvestmentStatements_OrderId",
                table: "InvestmentStatements",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PortfolioSnapshots_HoldingId_SnapshotDate",
                table: "PortfolioSnapshots",
                columns: new[] { "HoldingId", "SnapshotDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PortfolioSnapshots_InvestorUserId",
                table: "PortfolioSnapshots",
                column: "InvestorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PortfolioSnapshots_InvestorUserId_SnapshotDate",
                table: "PortfolioSnapshots",
                columns: new[] { "InvestorUserId", "SnapshotDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PortfolioSnapshots_SnapshotDate",
                table: "PortfolioSnapshots",
                column: "SnapshotDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvestmentStatements");

            migrationBuilder.DropTable(
                name: "PortfolioSnapshots");

            migrationBuilder.DropTable(
                name: "Holdings");

            migrationBuilder.DropTable(
                name: "InvestmentOrders");
        }
    }
}
