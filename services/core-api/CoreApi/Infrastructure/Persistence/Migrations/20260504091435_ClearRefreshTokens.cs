using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreApi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ClearRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM refresh_tokens;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
