using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MutualFund.Auth.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateSchemePermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // scheme.create (2), scheme.update (3), fund.approval (4), and
            // nav.read (5) are replaced by a single scheme.manage permission
            // (Scheme Enrollment is one on/off switch for Employees, not
            // separately-grantable read/write/approve tiers — see
            // PermissionType.cs). FK_UserPermissions_Permissions_PermissionId
            // cascades, so any existing UserPermission grants referencing
            // these ids are removed automatically.
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValues: new object[] { 2, 3, 4, 5 });

            // scheme.read (1) becomes scheme.manage (1) — same row, updated
            // in place so any existing grant of "scheme.read" now reads as
            // the new blanket "scheme.manage" permission instead of vanishing.
            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Name", "Description" },
                values: new object[] { "scheme.manage", "Manage Scheme Enrollment", "Enroll, update, and approve schemes/funds" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Code", "Name", "Description" },
                values: new object[] { "scheme.read", "Read Schemes", "View scheme enrollment data" });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Code", "CreatedAt", "Description", "Name" },
                values: new object[,]
                {
                    { 2, "scheme.create", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Enroll new schemes", "Create Schemes" },
                    { 3, "scheme.update", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Update scheme enrollment status", "Update Schemes" },
                    { 4, "fund.approval", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Approve or disable fund-level schemes", "Fund Approval" },
                    { 5, "nav.read", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "View NAV comparison data", "Read NAV Data" }
                });
        }
    }
}
