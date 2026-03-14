import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contentStatusEnum } from "./enums";

export const blogPostsTable = pgTable("blog_posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  coverAlt: text("cover_alt"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  authorId: text("author_id"),
  status: contentStatusEnum("status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const buyingGuidesTable = pgTable("buying_guides", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  coverImage: text("cover_image"),
  coverAlt: text("cover_alt"),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  categoryId: text("category_id"),
  status: contentStatusEnum("status").notNull().default("DRAFT"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const flatPagesTable = pgTable("flat_pages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),
  seoTitle: text("seo_title"),
  seoDesc: text("seo_desc"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBlogPostSchema = createInsertSchema(blogPostsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPostsTable.$inferSelect;

export const insertBuyingGuideSchema = createInsertSchema(buyingGuidesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBuyingGuide = z.infer<typeof insertBuyingGuideSchema>;
export type BuyingGuide = typeof buyingGuidesTable.$inferSelect;

export const insertFlatPageSchema = createInsertSchema(flatPagesTable).omit({ id: true, updatedAt: true });
export type InsertFlatPage = z.infer<typeof insertFlatPageSchema>;
export type FlatPage = typeof flatPagesTable.$inferSelect;
