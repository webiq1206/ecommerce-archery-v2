import { pgTable, text, timestamp, integer, boolean, numeric, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productStatusEnum } from "./enums";
import { brandsTable } from "./brands";
import { categoriesTable } from "./categories";
import { collectionsTable } from "./collections";
import { distributorsTable } from "./distributors";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  status: productStatusEnum("status").notNull().default("DRAFT"),
  shortDescription: text("short_description"),
  description: text("description"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  seoKeywords: text("seo_keywords"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  weight: numeric("weight", { precision: 8, scale: 2 }),
  weightUnit: text("weight_unit").notNull().default("lbs"),
  brandId: text("brand_id").references(() => brandsTable.id),
  distributorId: text("distributor_id").references(() => distributorsTable.id),
  aiSummary: text("ai_summary"),
  buyingGuideNote: text("buying_guide_note"),
  schemaType: text("schema_type").notNull().default("Product"),
  gtin: text("gtin"),
  mpn: text("mpn"),
  conditionNew: boolean("condition_new").notNull().default(true),
  isDigital: boolean("is_digital").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isNewArrival: boolean("is_new_arrival").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  searchVector: text("search_vector"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const productImagesTable = pgTable("product_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  isLifestyle: boolean("is_lifestyle").notNull().default(false),
});

export const productVariantsTable = pgTable("product_variants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  inventory: integer("inventory").notNull().default(0),
  weight: numeric("weight", { precision: 8, scale: 2 }),
  isAvailable: boolean("is_available").notNull().default(true),
  options: json("options").$type<Record<string, string>>(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productSpecsTable = pgTable("product_specs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  value: text("value").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productFaqsTable = pgTable("product_faqs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const productCategoriesTable = pgTable("product_categories", {
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.productId, t.categoryId] })]);

export const productCollectionsTable = pgTable("product_collections", {
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  collectionId: text("collection_id").notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.productId, t.collectionId] })]);

export const productTagsTable = pgTable("product_tags", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true, searchVector: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
export type ProductImage = typeof productImagesTable.$inferSelect;
export type ProductVariant = typeof productVariantsTable.$inferSelect;
