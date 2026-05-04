using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreApi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS tenant_domains CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS tenants CASCADE;");

            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_users_tenant_id_email\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_user_addresses_tenant_id_user_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_site_settings_tenant_id_key\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_roles_name\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_products_tenant_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_products_tenant_id_sku\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_products_tenant_id_slug\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_orders_tenant_id_order_number\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_orders_tenant_id_user_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_inventories_tenant_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_categories_tenant_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_categories_tenant_id_slug\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_carts_tenant_id_user_id\";");

            migrationBuilder.Sql("ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE user_addresses DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE site_settings DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE roles DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE products DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE product_images DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE orders DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE order_items DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE inventories DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE categories DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE carts DROP COLUMN IF EXISTS tenant_id;");
            migrationBuilder.Sql("ALTER TABLE cart_items DROP COLUMN IF EXISTS tenant_id;");

            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_users_email\" ON users (email);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_site_settings_key\" ON site_settings (key);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_roles_name\" ON roles (name);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_products_sku\" ON products (sku) WHERE sku IS NOT NULL;");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_products_slug\" ON products (slug);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_orders_order_number\" ON orders (order_number);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_orders_user_id\" ON orders (user_id);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_categories_slug\" ON categories (slug);");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_carts_user_id\" ON carts (user_id);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_email",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_site_settings_key",
                table: "site_settings");

            migrationBuilder.DropIndex(
                name: "IX_roles_name",
                table: "roles");

            migrationBuilder.DropIndex(
                name: "IX_products_sku",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_products_slug",
                table: "products");

            migrationBuilder.DropIndex(
                name: "IX_orders_order_number",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_orders_user_id",
                table: "orders");

            migrationBuilder.DropIndex(
                name: "IX_categories_slug",
                table: "categories");

            migrationBuilder.DropIndex(
                name: "IX_carts_user_id",
                table: "carts");

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "user_addresses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "site_settings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "roles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "refresh_tokens",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "products",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "product_images",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "orders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "order_items",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "inventories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "categories",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "carts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "cart_items",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tenant_domains",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    domain = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    verification_token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_domains", x => x.id);
                    table.ForeignKey(
                        name: "FK_tenant_domains_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_tenant_id_email",
                table: "users",
                columns: new[] { "tenant_id", "email" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_addresses_tenant_id_user_id",
                table: "user_addresses",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_site_settings_tenant_id_key",
                table: "site_settings",
                columns: new[] { "tenant_id", "key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_name",
                table: "roles",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_products_tenant_id",
                table: "products",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_products_tenant_id_sku",
                table: "products",
                columns: new[] { "tenant_id", "sku" },
                unique: true,
                filter: "sku IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_products_tenant_id_slug",
                table: "products",
                columns: new[] { "tenant_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_orders_tenant_id_order_number",
                table: "orders",
                columns: new[] { "tenant_id", "order_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_orders_tenant_id_user_id",
                table: "orders",
                columns: new[] { "tenant_id", "user_id" });

            migrationBuilder.CreateIndex(
                name: "IX_inventories_tenant_id",
                table: "inventories",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_categories_tenant_id",
                table: "categories",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_categories_tenant_id_slug",
                table: "categories",
                columns: new[] { "tenant_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_carts_tenant_id_user_id",
                table: "carts",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_domains_domain",
                table: "tenant_domains",
                column: "domain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_domains_status",
                table: "tenant_domains",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_domains_tenant_id",
                table: "tenant_domains",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_slug",
                table: "tenants",
                column: "slug",
                unique: true);
        }
    }
}
