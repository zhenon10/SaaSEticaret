using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreApi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAddresses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_addresses",
                columns: table => new
                {
                    id           = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id    = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id      = table.Column<Guid>(type: "uuid", nullable: false),
                    label        = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    full_name    = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    phone        = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    line1        = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    line2        = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    city         = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    district     = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    postal_code  = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    country      = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: "Türkiye"),
                    is_default   = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at   = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_addresses", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_addresses_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_addresses_tenant_id_user_id",
                table: "user_addresses",
                columns: new[] { "tenant_id", "user_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "user_addresses");
        }
    }
}
