using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MutualFund.Scheme.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFundNameToSchemeEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FundName",
                table: "SchemeEnrollments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FundName",
                table: "SchemeEnrollments");
        }
    }
}
