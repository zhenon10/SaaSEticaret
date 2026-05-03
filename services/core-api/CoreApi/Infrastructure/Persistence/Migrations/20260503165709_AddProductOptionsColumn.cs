using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoreApi.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductOptionsColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_cart_items_cart_id_product_id",
                table: "cart_items");

            migrationBuilder.AddColumn<string>(
                name: "options_json",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "color",
                table: "cart_items",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "size",
                table: "cart_items",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_cart_items_cart_id_product_id_color_size",
                table: "cart_items",
                columns: new[] { "cart_id", "product_id", "color", "size" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_cart_items_cart_id_product_id_color_size",
                table: "cart_items");

            migrationBuilder.DropColumn(
                name: "options_json",
                table: "products");

            migrationBuilder.DropColumn(
                name: "color",
                table: "cart_items");

            migrationBuilder.DropColumn(
                name: "size",
                table: "cart_items");

            migrationBuilder.CreateIndex(
                name: "IX_cart_items_cart_id_product_id",
                table: "cart_items",
                columns: new[] { "cart_id", "product_id" },
                unique: true);
        }
    }
}
